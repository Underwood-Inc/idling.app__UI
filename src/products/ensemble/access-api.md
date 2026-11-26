---
title: Access API
description: Cloudflare Worker for roles, permissions, and quotas (Access Service)
---

# Access API

**What this is:** Cloudflare Worker **`@strixun/access-service`** — authorization service for Strixun (roles, permissions, quotas). Consumed by OTP auth worker and surfaced in [Access Hub](/products/showcase/access-hub) React admin UI.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/access-service/package.json`
- **Main:** `worker.ts` (also `./index.ts` export for types)
- **Bundle:** `esbuild worker.ts` → `dist/worker.js`
- **Dev port:** **8795** (`wrangler dev --local --env development`)

## Build graph

`build:deps` pulls api-framework, kv-entities, feature-flags, and builds OTP + customer-api workers for integrated tests — see `pretest` in package.json.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Access Hub 403 | Worker env; JWT from OTP auth |
| Integration tests fail | `build:deps` order before `vitest` |

Types export: `./types/authorization.ts` for consumers.

---

**Sources (audited):** `strixun-stream-suite/serverless/access-service/package.json`, `strixun-stream-suite/serverless/access-service/worker.ts`