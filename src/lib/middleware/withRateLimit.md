---
title: withRateLimit Middleware
category: middleware
tags: [rate-limiting, middleware, api-protection, multi-layer]
status: documented
---

# withRateLimit Middleware

A higher-order function that wraps API route handlers with intelligent multi-layered rate limiting protection. This middleware provides the primary interface for applying rate limiting to API endpoints and integrates seamlessly with the `RateLimitService`.

## Overview

The `withRateLimit` middleware implements a sophisticated multi-layered approach to rate limiting:

- **Device-Level Protection**: Primary rate limiting per device fingerprint
- **Network-Level Protection**: Household-wide protection against severe abuse
- **User-Level Protection**: Authenticated user-specific rate limiting
- **Progressive Penalties**: Escalating restrictions for suspicious behavior

## Key Features

### 🛡️ **Multi-Layered Defense**

1. **Device-Level Rate Limiting**: Allows multiple devices per household while blocking device-specific abuse
2. **Network-Level Rate Limiting**: Triggers only when device shows suspicious behavior (penalty level ≥ 2)
3. **User-Level Rate Limiting**: Applied to authenticated requests for granular control

### ⚡ **Smart Exemptions**

- Critical system endpoints (authentication, health checks)
- Development dry-run requests (`?dry-run=true`)
- SSE and real-time endpoints
- Internal Next.js routes

### 🔧 **Flexible Configuration**

- Automatic rate limit type detection based on endpoint patterns
- Custom rate limiting options
- Per-endpoint bypass capabilities

## Usage

### Basic Implementation

```typescript
import { withRateLimit } from '@lib/middleware/withRateLimit';

// Apply to GET handler
export const GET = withRateLimit(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ data: 'success' });
});

// Apply to multiple handlers
export const GET = withRateLimit(getHandler);
export const POST = withRateLimit(postHandler);
export const PUT = withRateLimit(putHandler);
```

### With Custom Options

```typescript
// Skip rate limiting for specific endpoint
export const GET = withRateLimit(getHandler, {
  skipRateLimit: true
});

// Normal rate limiting (default)
export const POST = withRateLimit(postHandler);
```

### Advanced Usage with Multiple Protections

```typescript
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { withUserRoles } from '@lib/middleware/withUserRoles';
import { withUserPermissions } from '@lib/middleware/withUserPermissions';

// Combine multiple middleware layers
export const DELETE = withUserRoles(
  withUserPermissions(withRateLimit(deleteHandler))
);
```

## Rate Limit Detection

The middleware automatically detects the appropriate rate limit configuration based on endpoint patterns:

| Endpoint Pattern         | Rate Limit Type | Configuration |
| ------------------------ | --------------- | ------------- |
| `/api/auth/*`            | `auth`          | 500 req/min   |
| `/api/upload/*`          | `upload`        | 5 req/min     |
| `/api/admin/*`           | `admin`         | 50 req/min    |
| `/api/sse/*`, `*/stream` | `sse`           | 1000 req/min  |
| `/api/og-image/*`        | `og-image`      | 1 req/day     |
| `*/search`, `*/filter`   | `search`        | 200 req/min   |
| Default                  | `api`           | 100 req/min   |

## Exempt Endpoints

The following endpoints are automatically exempt from rate limiting:

```typescript
enum RateLimitExemptPaths {
  AUTH_SESSION = '/api/auth/session',
  ALERTS_ACTIVE = '/api/alerts/active',
  USER_TIMEOUT = '/api/user/timeout',
  ADMIN_ALERTS = '/api/admin/alerts',
  NEXT_INTERNAL = '/_next/',
  VERSION = '/api/version',
  LINK_PREVIEW = '/api/link-preview',
  TEST_HEALTH = '/api/test/health',
  NOTIFICATIONS_POLL = '/api/notifications/poll',
  BUDDHA_API = 'https://buddha-api.com/api/random'
}
```

## Multi-Layered Rate Limiting Flow

### 1. Device-Level Rate Limiting

**Primary protection layer** - Applied to all requests

```typescript
const deviceRateLimitResult = await rateLimitService.checkRateLimit({
  identifier: identifiers.perDevice,
  configType: rateLimitType
});
```

- Uses device fingerprint + network ID
- Allows multiple devices per household
- Blocks device-specific abuse patterns

### 2. Network-Level Rate Limiting

**Triggered when device penalty level ≥ 2**

```typescript
if (deviceRateLimitResult.penaltyLevel >= 2) {
  const networkRateLimitResult = await rateLimitService.checkRateLimit({
    identifier: identifiers.perNetwork,
    configType: rateLimitType,
    customConfig: {
      windowMs: 60 * 1000,
      maxRequests: 500,
      storage: 'memory',
      keyPrefix: 'network'
    }
  });
}
```

- Household-wide protection against severe abuse
- Much higher limits (500 req/min) for legitimate family usage
- Triggered only for suspicious devices

### 3. User-Level Rate Limiting

**Applied to authenticated users**

```typescript
if (session?.user?.id) {
  const userRateLimitResult = await rateLimitService.checkRateLimit({
    identifier: identifiers.perUser,
    configType: rateLimitType
  });
}
```

- Per-user rate limiting for authenticated requests
- Falls back to device-level for unauthenticated users
- Enables user-specific quota management

## Request Identifiers

The middleware uses sophisticated request identification:

```typescript
interface RequestIdentifiers {
  ip: string; // Client IP address
  user: string | null; // User ID (if authenticated)
  deviceFingerprint: string; // Device fingerprint
  networkId: string; // Network identifier
  composite: string; // Combined identifier
  perDevice: string; // Device-specific key
  perUser: string; // User-specific key
  perNetwork: string; // Network-specific key
  perIP: string; // IP-specific key
}
```

See [`requestIdentifier.ts`](../utils/requestIdentifier.md) for detailed implementation.

## Response Headers

### Successful Requests

```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T12:00:00Z
```

### Rate Limited Requests (429)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-01T12:01:00Z
Retry-After: 60
```

### Security Warnings

```
X-Security-Warning: Rate limit violation detected
```

## Error Responses

### Standard Rate Limit

```json
{
  "error": "Rate limit exceeded. Please try again in 1 minute.",
  "retryAfter": 60,
  "retryAfterHuman": "1 minute",
  "penaltyLevel": 1,
  "quotaType": "per-minute"
}
```

### Attack Detection

```json
{
  "error": "Suspicious activity detected. Access temporarily restricted. Try again in 15 minutes.",
  "retryAfter": 900,
  "retryAfterHuman": "15 minutes",
  "penaltyLevel": 3,
  "quotaType": "per-minute"
}
```

## Progressive Penalty System

The middleware automatically escalates penalties for repeated violations:

| Penalty Level | Backoff Period | Trigger Condition     |
| ------------- | -------------- | --------------------- |
| 0             | None           | Normal operation      |
| 1             | 1 minute       | First violation       |
| 2             | 5 minutes      | Repeated violations   |
| 3+            | 15+ minutes    | Attack classification |

## Integration with Other Systems

### Client-Side Integration

The middleware works seamlessly with the client-side fetch interceptor:

```typescript
// GlobalLoadingContext.tsx automatically handles 429 responses
if (response.status === 429) {
  const rateLimitData = await response.clone().json();
  sessionStorage.setItem(
    'rate-limit-info',
    JSON.stringify({
      error: rateLimitData.error,
      retryAfter: rateLimitData.retryAfter,
      quotaType: rateLimitData.quotaType,
      penaltyLevel: rateLimitData.penaltyLevel,
      timestamp: Date.now()
    })
  );
}
```

### Banner System Integration

Rate limit violations automatically trigger user-friendly banners:

```typescript
// SimpleBannerSystem.tsx
if (info.retryAfter && info.retryAfter > 0) {
  newBanners.push({
    id: 'rate-limit-banner',
    type: 'rate-limit',
    title: 'Rate Limit Exceeded',
    message: info.error,
    retryAfter: info.retryAfter,
    metadata: {
      quotaType: info.quotaType,
      penaltyLevel: info.penaltyLevel,
      isAttack: info.penaltyLevel >= 3
    }
  });
}
```

## Development and Testing

### Development Bypass

Set environment variable to bypass rate limiting:

```bash
BYPASS_RATE_LIMIT=true
```

### Testing Rate Limits

```typescript
// Development endpoint for testing
POST /api/admin/test-rate-limit
{
  "testType": "normal" | "attack",
  "targetUserId": 123
}
```

## Performance Considerations

- **Memory Usage**: In-memory sliding window tracking
- **Latency**: < 10ms overhead per request
- **Cleanup**: Automatic cleanup every 5 minutes
- **Edge Runtime**: Compatible with both Node.js and Edge Runtime

## Security Considerations

### Attack Mitigation

- Progressive penalties deter sustained attacks
- Network-level protection prevents household-wide abuse
- Device fingerprinting resists simple IP rotation

### Privacy Protection

- Device fingerprints are hashed and anonymized
- No personally identifiable information stored
- Automatic cleanup of old tracking data

## Error Handling

### Graceful Degradation

```typescript
try {
  const rateLimitResult = await rateLimitService.checkRateLimit(options);
  // Handle rate limiting
} catch (error) {
  console.error('Rate limiting error:', error);
  // Allow request to proceed on error
  return handler(req, context);
}
```

### Logging and Monitoring

```typescript
console.warn(`Rate limit exceeded for ${identifier}`, {
  penaltyLevel: result.penaltyLevel,
  isAttack: result.isAttack,
  retryAfter: result.retryAfter,
  quotaType: result.quotaType
});
```

## Related Documentation

- **[RateLimitService](../services/RateLimitService.md)** - Core rate limiting service
- **[Request Identifiers](../utils/requestIdentifier.md)** - Request identification utilities
- **[Admin Rate Limiting](../../app/api/admin.md#rate-limiting)** - Administrative controls
- **[Quota System Integration](../services/EnhancedQuotaService.md)** - Quota system integration

## Examples

### Standard API Route

```typescript
// app/api/posts/route.ts
import { withRateLimit } from '@lib/middleware/withRateLimit';

async function getHandler(request: NextRequest) {
  // API logic here
  return NextResponse.json({ posts: [] });
}

export const GET = withRateLimit(getHandler);
```

### Upload Endpoint

```typescript
// app/api/upload/image/route.ts
import { withRateLimit } from '@lib/middleware/withRateLimit';

async function postHandler(request: NextRequest) {
  // Upload logic here
  return NextResponse.json({ success: true });
}

// Automatically applies 'upload' rate limit (5 req/min)
export const POST = withRateLimit(postHandler);
```

### Admin Endpoint with Multiple Protections

```typescript
// app/api/admin/users/route.ts
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { withUserRoles } from '@lib/middleware/withUserRoles';
import { withUserPermissions } from '@lib/middleware/withUserPermissions';

async function getHandler(request: NextRequest) {
  // Admin logic here
  return NextResponse.json({ users: [] });
}

export const GET = withUserRoles(
  withUserPermissions(
    withRateLimit(getHandler) // 50 req/min for admin endpoints
  )
);
```

---

_File: `src/lib/middleware/withRateLimit.ts`_  
_Last Updated: 2025-01-02_
