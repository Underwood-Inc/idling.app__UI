---
title: 'RateLimitService'
description: 'Sliding-window and daily quota rate limiting for API routes'
category: service
---

# RateLimitService

**What this does:** a **singleton** rate limiter used by API middleware — per-minute sliding windows in memory, optional database-backed daily quotas, progressive penalties when abuse is detected, and a development bypass path.

## Configuration presets

`RateLimitService.CONFIGS` names common profiles:

| Key | Window | Limit | Storage |
| --- | ------ | ----- | ------- |
| `api` | 1 minute | 100 req/min per key | memory |
| `auth` | 1 minute | 500 req/min (session-heavy endpoints) | memory |

Custom configs can be passed via `RateLimitOptions.customConfig`. Keys are prefixed (`keyPrefix`) so auth and generic API counters do not collide.

## Core types

- **`RateLimitConfig`** — `windowMs`, `maxRequests`, optional `storage`, skip flags, `keyPrefix`.
- **`RateLimitResult`** — `allowed`, `remaining`, `resetTime`, optional `retryAfter`, `penaltyLevel`, `isAttack`, `quotaType`.
- **`RateLimitOptions`** — `identifier` (usually IP or user id), `configType`, optional `customConfig`, `bypassDevelopment`.

## Behavior

1. **Sliding window** — request timestamps stored per key; old entries fall off outside `windowMs`.
2. **Penalties** — repeated violations increase `penaltyLevel` and can set `backoffUntil`.
3. **Attack detection** — `isAttack` signals aggressive patterns for logging/admin review.
4. **Database quotas** — when `storage: 'database'`, daily counts can persist via the injected `DatabaseService` (OG image service path today).
5. **Cleanup** — interval timer evicts stale memory entries.

## Usage in routes

Routes typically wrap handlers with `withRateLimit` / universal enhancement helpers in `@lib/api/*` rather than calling the service directly. Admin can inspect limits via `/api/admin/rate-limit` routes.

Example pattern (conceptual):

```typescript
import { RateLimitService } from '@lib/services/RateLimitService';

const service = RateLimitService.getInstance();
const result = await service.check({
  identifier: clientIp,
  configType: 'api',
});
if (!result.allowed) {
  // return 429 with Retry-After
}
```

See `src/lib/middleware/withRateLimit.md` for the Next.js App Router wiring.

## Development

`bypassDevelopment: true` (when enabled in options) skips limits for local debugging — do not enable in production configs.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Everyone 429 | Clock skew, window too small, shared key prefix |
| Limits not persisting daily | `storage` not set to `database` or DB service null |
| Auth routes blocked | Confirm `configType: 'auth'` vs `api` on session polling endpoints |

## Related

- [withRateLimit](../middleware/withRateLimit.md)
- [API overview](/idling/api-overview)