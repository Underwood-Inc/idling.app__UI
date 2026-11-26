---
title: Feature Flag Service
description: Cloudflare Worker and D1 store for suite feature flags
---

# Feature Flag Service

**What this is:** Cloudflare Worker **`feature-flag-service`** (`@strixun/feature-flag-service` package in `serverless/feature-flag-service`) — evaluates and administers feature flags from D1 + KV cache using the workspace catalog **`@strixun/feature-flags`**. Consumers include auth, access, and stream-suite surfaces.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/feature-flag-service/package.json`
- **Main:** `worker.ts` → `dist/worker.js`
- **Dev:** `wrangler dev --port 8797 --local --env development`
- **Production route:** `flags-api.idling.app/*`

## Bindings

| Binding | Role |
| ------- | ---- |
| `FLAGS_DB` | D1 database `idling-feature-flags` |
| `FLAGS_KV` | Hot cache for evaluations |
| `AUTH_SERVICE` | JWKS verification (`JWT_ISSUER=https://auth.idling.app`) |

Management routes call `callerCanManageFlags` after `authenticateRequest` (see `worker.ts`).

## Related UI

Operators edit flags in [Flags Admin](/products/ensemble/flags-admin) (`flags.idling.app`).

---

**Sources (audited):** `strixun-stream-suite/serverless/feature-flag-service/package.json`, `strixun-stream-suite/serverless/feature-flag-service/worker.ts`, `strixun-stream-suite/serverless/feature-flag-service/wrangler.toml`