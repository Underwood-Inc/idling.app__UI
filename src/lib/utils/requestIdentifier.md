---
title: Request Identifier Utilities
category: utility
tags: [rate-limiting, device-fingerprinting, network-identification, security]
status: documented
---

# Request Identifier Utilities

A comprehensive set of utilities for generating secure, flexible request identifiers used in rate limiting and security systems. These utilities enable sophisticated multi-layered protection while respecting user privacy and household sharing scenarios.

## Overview

The request identifier system creates multiple types of identifiers to support different rate limiting strategies:

- **Device Fingerprinting**: Identifies unique devices without storing personal data
- **Network Identification**: Groups devices by network for household-level protection
- **User Identification**: Links authenticated users to their usage patterns
- **Composite Identifiers**: Combines multiple factors for flexible rate limiting

## Key Components

### 🔍 **Device Fingerprinting**

Creates a unique identifier for each device while preserving privacy:

```typescript
function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  // Create fingerprint from browser characteristics
  const fingerprint = createHash('sha256')
    .update(`${userAgent}:${acceptLanguage}:${acceptEncoding}`)
    .digest('hex')
    .substring(0, 16); // First 16 chars for efficiency

  return fingerprint;
}
```

### 🌐 **Network Identification**

Groups devices by network for household-level rate limiting:

```typescript
function getNetworkIdentifier(ip: string): string {
  try {
    // Create network-level identifier (preserves household grouping)
    const networkHash = createHash('sha256')
      .update(`network:${ip}:${NETWORK_SALT}`)
      .digest('hex')
      .substring(0, 12);

    return networkHash;
  } catch (error) {
    return 'unknown-network';
  }
}
```

### 👤 **User Identification**

Links authenticated users to their rate limiting quotas:

```typescript
function getUserIdentifier(session: any): string | null {
  if (!session?.user?.id) {
    return null;
  }

  // Use user ID for authenticated rate limiting
  return `user:${session.user.id}`;
}
```

## Core Interface

### RequestIdentifiers

```typescript
interface RequestIdentifiers {
  ip: string; // Raw client IP address
  user: string | null; // User ID (if authenticated)
  deviceFingerprint: string; // Unique device identifier
  networkId: string; // Network-level identifier
  composite: string; // Default combined identifier
  perDevice: string; // Device-specific rate limiting
  perUser: string; // User-specific rate limiting
  perNetwork: string; // Network-specific rate limiting
  perIP: string; // IP-specific rate limiting
}
```

### Main Function

```typescript
function getRequestIdentifier(
  request: NextRequest,
  session: any
): RequestIdentifiers {
  const ip = getClientIP(request);
  const user = getUserIdentifier(session);
  const deviceFingerprint = generateDeviceFingerprint(request);
  const networkId = getNetworkIdentifier(ip);

  // Create different identifier strategies
  const perDevice = `device:${networkId}:${deviceFingerprint}`;
  const perUser = user || perDevice; // Fall back to device if no user
  const perNetwork = `network:${networkId}`;
  const perIP = `ip:${ip}`;

  // Default composite for backward compatibility
  const composite = user ? `${perDevice}:${user}` : perDevice;

  return {
    ip,
    user,
    deviceFingerprint,
    networkId,
    composite,
    perDevice,
    perUser,
    perNetwork,
    perIP
  };
}
```

## Rate Limit Type Detection

Automatically determines the appropriate rate limit configuration based on endpoint patterns:

```typescript
function getRateLimitType(pathname: string): RateLimitConfigType {
  // Authentication endpoints - very generous for session checks
  if (pathname.startsWith('/api/auth')) {
    return 'auth'; // 500 req/min
  }

  // File upload endpoints - restrictive due to resource usage
  if (pathname.startsWith('/api/upload')) {
    return 'upload'; // 5 req/min
  }

  // Admin panel endpoints - moderate limits for admin actions
  if (pathname.startsWith('/api/admin')) {
    return 'admin'; // 50 req/min
  }

  // Server-sent events - very lenient for persistent connections
  if (
    pathname.includes('/stream') ||
    pathname.startsWith('/api/sse') ||
    pathname.startsWith('/api/alerts/stream')
  ) {
    return 'sse'; // 1000 req/min
  }

  // OG Image generation - daily quota with database persistence
  if (pathname.startsWith('/api/og-image')) {
    return 'og-image'; // 1 req/day
  }

  // Search and filter operations - generous for user experience
  if (
    pathname.includes('search') ||
    pathname.includes('filter') ||
    pathname.includes('submissions') ||
    pathname.includes('posts')
  ) {
    return 'search'; // 200 req/min
  }

  // Default API rate limiting
  return 'api'; // 100 req/min
}
```

## Identifier Strategies

### Device-Level Strategy (`perDevice`)

**Primary rate limiting approach**

- **Format**: `device:{networkId}:{deviceFingerprint}`
- **Use Case**: Primary protection while allowing multiple devices per household
- **Benefits**:
  - Blocks device-specific abuse
  - Allows family members to use different devices
  - Resistant to simple IP rotation attacks

```typescript
const perDevice = `device:${networkId}:${deviceFingerprint}`;
// Example: "device:a1b2c3d4:e5f6g7h8"
```

### Network-Level Strategy (`perNetwork`)

**Household-wide protection**

- **Format**: `network:{networkId}`
- **Use Case**: Triggered when device penalty level ≥ 2
- **Benefits**:
  - Prevents household-wide abuse
  - Higher limits for legitimate family usage
  - Only activated for suspicious activity

```typescript
const perNetwork = `network:${networkId}`;
// Example: "network:a1b2c3d4"
```

### User-Level Strategy (`perUser`)

**Authenticated user protection**

- **Format**: `user:{userId}` or falls back to `perDevice`
- **Use Case**: Authenticated requests with user-specific quotas
- **Benefits**:
  - Enables subscription-based rate limits
  - User-specific quota management
  - Cross-device consistency for authenticated users

```typescript
const perUser = user || perDevice;
// Authenticated: "user:123"
// Anonymous: "device:a1b2c3d4:e5f6g7h8"
```

### IP-Level Strategy (`perIP`)

**Simple IP-based limiting**

- **Format**: `ip:{ipAddress}`
- **Use Case**: Legacy support and simple scenarios
- **Limitations**:
  - Not household-friendly
  - Vulnerable to IP rotation
  - Can affect multiple users behind NAT

```typescript
const perIP = `ip:${ip}`;
// Example: "ip:192.168.1.100"
```

## Security Features

### Privacy Protection

- **No PII Storage**: Device fingerprints are hashed and anonymized
- **Salt Usage**: Network identifiers use cryptographic salts
- **Limited Retention**: Automatic cleanup of old tracking data
- **Hashed Identifiers**: All identifiers are cryptographically hashed

### Attack Resistance

- **IP Rotation Resistance**: Device fingerprinting survives IP changes
- **Bot Detection**: Browser characteristics help identify automated clients
- **Progressive Penalties**: Multi-layer system escalates restrictions
- **Household Awareness**: Prevents collateral damage to family members

## Client IP Detection

Robust client IP extraction with proxy support:

```typescript
function getClientIP(request: NextRequest): string {
  // Check various headers for real client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const xClientIP = request.headers.get('x-client-ip');

  if (xForwardedFor) {
    // Handle comma-separated list, take first IP
    return xForwardedFor.split(',')[0].trim();
  }

  if (xRealIP) {
    return xRealIP.trim();
  }

  if (xClientIP) {
    return xClientIP.trim();
  }

  // Fallback to connection IP (may be proxy)
  return request.ip || 'unknown';
}
```

## Usage Examples

### Basic Usage

```typescript
import {
  getRequestIdentifier,
  getRateLimitType
} from '@lib/utils/requestIdentifier';
import { auth } from '@lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();

  // Get comprehensive identifiers
  const identifiers = getRequestIdentifier(request, session);

  // Determine rate limit type
  const rateLimitType = getRateLimitType(request.url);

  console.log('Rate limiting info:', {
    rateLimitType, // 'api', 'auth', 'upload', etc.
    perDevice: identifiers.perDevice,
    perUser: identifiers.perUser,
    perNetwork: identifiers.perNetwork
  });
}
```

### Multi-Layer Rate Limiting

```typescript
// Primary device-level protection
const deviceResult = await rateLimitService.checkRateLimit({
  identifier: identifiers.perDevice,
  configType: rateLimitType
});

// Network-level protection (if device is suspicious)
if (deviceResult.penaltyLevel >= 2) {
  const networkResult = await rateLimitService.checkRateLimit({
    identifier: identifiers.perNetwork,
    configType: rateLimitType,
    customConfig: {
      windowMs: 60 * 1000,
      maxRequests: 500, // Higher limit for network
      storage: 'memory',
      keyPrefix: 'network'
    }
  });
}

// User-level protection (if authenticated)
if (session?.user?.id) {
  const userResult = await rateLimitService.checkRateLimit({
    identifier: identifiers.perUser,
    configType: rateLimitType
  });
}
```

## Configuration

### Environment Variables

```bash
# Optional: Custom salt for network hashing (recommended for production)
NETWORK_ID_SALT=your-secret-salt-here

# Optional: Custom fingerprint components
DEVICE_FINGERPRINT_HEADERS=user-agent,accept-language,accept-encoding
```

### Customization

```typescript
// Custom fingerprint generation
const customFingerprint = generateDeviceFingerprint(request, {
  includeHeaders: ['user-agent', 'accept-language'],
  hashLength: 12,
  includeTimezone: true
});

// Custom network grouping
const customNetworkId = getNetworkIdentifier(ip, {
  subnetMask: '/24', // Group by subnet
  useGeolocation: false
});
```

## Rate Limit Type Mapping

| Endpoint Pattern         | Rate Limit Type | Window | Max Requests | Storage  |
| ------------------------ | --------------- | ------ | ------------ | -------- |
| `/api/auth/*`            | `auth`          | 1 min  | 500          | Memory   |
| `/api/upload/*`          | `upload`        | 1 min  | 5            | Memory   |
| `/api/admin/*`           | `admin`         | 1 min  | 50           | Memory   |
| `/api/sse/*`, `*/stream` | `sse`           | 1 min  | 1000         | Memory   |
| `/api/og-image/*`        | `og-image`      | 24 hrs | 1            | Database |
| `*/search`, `*/filter`   | `search`        | 1 min  | 200          | Memory   |
| Default                  | `api`           | 1 min  | 100          | Memory   |

## Integration Points

### Middleware Integration

```typescript
// withRateLimit.ts
const identifiers = getRequestIdentifier(req, session);
const rateLimitType = getRateLimitType(url.pathname);
```

### Service Integration

```typescript
// RateLimitService.ts
const key = this.generateKey(identifier, config.keyPrefix || 'default');
```

### Database Integration

```typescript
// EnhancedQuotaService.ts
const quotaCheck = await EnhancedQuotaService.checkUserQuota(
  parseInt(userId),
  'og_generator',
  'daily_generations'
);
```

## Performance Considerations

- **Hashing Performance**: SHA256 hashing is fast but consider caching for high traffic
- **Memory Usage**: Device fingerprints are relatively small (16-32 chars)
- **Network Lookups**: IP geolocation is avoided for performance
- **Header Parsing**: Minimal header processing for speed

## Troubleshooting

### Common Issues

1. **Inconsistent Device Fingerprints**

   - Check if user agents are being modified by extensions
   - Verify header availability in different environments

2. **Network Grouping Problems**

   - Ensure consistent IP extraction across proxies
   - Check for IPv4/IPv6 mixing

3. **Rate Limit Bypassing**
   - Monitor penalty levels for escalating patterns
   - Check device fingerprint uniqueness

### Debug Information

```typescript
console.log('Request Identifier Debug:', {
  ip: identifiers.ip,
  userAgent: request.headers.get('user-agent'),
  deviceFingerprint: identifiers.deviceFingerprint,
  networkId: identifiers.networkId,
  rateLimitType,
  isAuthenticated: !!identifiers.user
});
```

## Related Documentation

- **[withRateLimit Middleware](../middleware/withRateLimit.md)** - Primary rate limiting middleware
- **[RateLimitService](../services/RateLimitService.md)** - Core rate limiting service
- **[EnhancedQuotaService](../services/EnhancedQuotaService.md)** - Quota system integration
- **[Admin Rate Limiting](../../app/api/admin.md#rate-limiting)** - Administrative controls

---

_File: `src/lib/utils/requestIdentifier.ts`_  
_Last Updated: 2025-01-02_
