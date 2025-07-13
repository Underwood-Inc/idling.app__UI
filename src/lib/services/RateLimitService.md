---
title: RateLimitService
category: service
tags: [rate-limiting, security, api-protection, singleton]
status: documented
---

# RateLimitService

A unified, composable rate limiting system that handles all rate limiting needs across the application. This service provides both per-minute sliding window limits and daily quota limits with database persistence.

## Overview

The `RateLimitService` is a singleton service that implements:

- **Sliding Window Rate Limiting**: For per-minute API limits using in-memory storage
- **Daily Quota Limits**: For resource-intensive operations with database persistence
- **Attack Detection**: Progressive penalties for detected abuse patterns
- **Development Bypass**: Configurable bypass for development environments
- **Fail-Fast Architecture**: Works properly on all devices or fails explicitly with clear errors

## Key Features

### 🔒 **Multiple Rate Limiting Strategies**

- **Memory-based**: Fast sliding window limits for standard API requests
- **Database-backed**: Persistent daily quotas for expensive operations
- **Progressive Penalties**: Escalating timeouts for repeated violations

### 🛡️ **Attack Protection**

- Automatic detection of abuse patterns
- Progressive backoff periods (1min → 5min → 15min → 1hr → 6hr → 24hr)
- Separate attack-specific rate limits

### ⚙️ **Reliable Configuration**

- Pre-configured limits for common scenarios
- Custom rate limiting configurations
- Per-endpoint customization
- **No fallbacks** - works properly or fails with clear error messages

## Usage

### Basic Rate Limiting

```typescript
import { RateLimitService } from '@lib/services/RateLimitService';

const rateLimiter = RateLimitService.getInstance();

// Check rate limit for API endpoint
const result = await rateLimiter.checkRateLimit({
  identifier: req.ip,
  configType: 'api'
});

if (!result.allowed) {
  return new Response('Rate limit exceeded', {
    status: 429,
    headers: {
      'Retry-After': result.retryAfter?.toString() || '60'
    }
  });
}
```

### Daily Quota Limiting

```typescript
// For expensive operations like OG image generation
const result = await rateLimiter.checkRateLimit({
  identifier: userId,
  configType: 'og-image' // Daily quota with database persistence
});

if (!result.allowed) {
  return new Response('Daily quota exceeded', { status: 429 });
}
```

### Custom Rate Limiting

```typescript
// Create custom rate limit configuration
const result = await rateLimiter.checkRateLimit({
  identifier: 'custom-operation',
  configType: 'custom',
  customConfig: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 requests per window
    storage: 'memory'
  }
});
```

## Pre-configured Rate Limits

| Config Type | Window   | Max Requests | Storage  | Use Case                 |
| ----------- | -------- | ------------ | -------- | ------------------------ |
| `api`       | 1 minute | 100          | Memory   | Standard API requests    |
| `auth`      | 1 minute | 500          | Memory   | Authentication endpoints |
| `upload`    | 1 minute | 5            | Memory   | File uploads             |
| `search`    | 1 minute | 200          | Memory   | Search/filter operations |
| `admin`     | 1 minute | 50           | Memory   | Admin panel actions      |
| `sse`       | 1 minute | 1000         | Memory   | Server-sent events       |
| `og-image`  | 24 hours | 1            | Database | Daily OG image quota     |
| `attack`    | 1 hour   | 1            | Memory   | Detected abuse patterns  |

## API Reference

### `checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult>`

Main method to check if a request should be rate limited.

**Parameters:**

- `options.identifier`: Unique identifier (IP address, user ID, etc.)
- `options.configType`: Pre-configured rate limit type or 'custom'
- `options.customConfig`: Custom configuration (required if configType is 'custom')
- `options.bypassDevelopment`: Whether to bypass limits in development

**Returns:** `RateLimitResult` object with:

- `allowed`: Whether the request is allowed
- `remaining`: Number of requests remaining in window
- `resetTime`: Timestamp when window resets
- `retryAfter`: Seconds to wait before retrying (if blocked)
- `penaltyLevel`: Current penalty level (0-5)
- `isAttack`: Whether this is classified as an attack
- `quotaType`: Type of quota applied

**Throws:** `Error` if unknown configuration type is provided

### `createAPILimiter(configType?: string)`

Creates a middleware-style rate limiter for API routes.

### `createCustomLimiter(config: RateLimitConfig)`

Creates a custom rate limiter with specific configuration.

### `resetRateLimit(identifier: string, configType?: string): void`

Manually reset rate limit for a specific identifier.

### `getStats()`

Get current rate limiting statistics and memory usage.

## Attack Detection & Progressive Penalties

The service automatically detects abuse patterns and applies progressive penalties:

1. **Level 0**: Normal operation
2. **Level 1**: 1-minute backoff after violation
3. **Level 2**: 5-minute backoff
4. **Level 3**: 15-minute backoff
5. **Level 4**: 1-hour backoff
6. **Level 5**: 6-hour backoff
7. **Level 6+**: 24-hour backoff

Penalty levels increase with repeated violations and decay over time.

## Fail-Fast Architecture

The service uses a fail-fast approach for maximum reliability:

- **Direct Dependencies**: All dependencies are imported directly
- **Explicit Errors**: Unknown configurations throw clear error messages
- **No Silent Failures**: Service works properly or fails with actionable errors
- **Consistent Behavior**: Same behavior across all devices and environments

## Environment Configuration

### Development Bypass

Set `BYPASS_RATE_LIMIT=true` in your environment to disable rate limiting during development.

### Database Configuration

For daily quotas, ensure your database service is properly configured. The service requires DatabaseService to be available for database-backed rate limiting.

## Example: API Route Implementation

```typescript
// app/api/example/route.ts
import { RateLimitService } from '@lib/services/RateLimitService';
import { getClientIP } from '@lib/utils/request';

export async function GET(request: Request) {
  const rateLimiter = RateLimitService.getInstance();
  const clientIP = getClientIP(request);

  // Check rate limit
  const rateLimit = await rateLimiter.checkRateLimit({
    identifier: clientIP,
    configType: 'api'
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.retryAfter,
        quotaType: rateLimit.quotaType
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter?.toString() || '60',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    );
  }

  // Process request normally
  return new Response(JSON.stringify({ data: 'success' }));
}
```

## Security Considerations

- **IP-based Limiting**: Use client IP for anonymous rate limiting
- **User-based Limiting**: Use authenticated user ID for user-specific limits
- **Attack Mitigation**: Progressive penalties help mitigate sustained attacks
- **Resource Protection**: Daily quotas protect expensive operations

## Performance Notes

- Memory storage provides sub-millisecond lookup times
- Database storage adds ~2-5ms latency for daily quotas
- Automatic cleanup prevents memory leaks
- Singleton pattern ensures efficient resource usage

## Error Handling

The service throws explicit errors for:
- Unknown configuration types
- Missing required dependencies
- Database connection failures (for database-backed limits)

This ensures issues are caught early and resolved rather than silently failing.

---

_File: `src/lib/services/RateLimitService.ts`_  
_Last Updated: 2025-01-15_
