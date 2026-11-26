---
title: Access Hub
description: React admin UI for roles, permissions, and quotas — pairs with Access Service worker
---

# Access Hub

**What this is:** Vite **React** app **`@strixun/access-hub`** — browser UI for Strixun access control (roles, permissions, quotas). Runs against the **Access Service** Cloudflare Worker in local dev via `dev:all`.

## App entry

- **Package:** `strixun-stream-suite/apps/access-hub/package.json`
- **Dev:** `vite` on default Vite port; `dev:all` runs frontend + `pnpm --filter @strixun/access-service dev` (worker port **8795**)
- **Build:** `tsc -b && vite build`
- **Deps:** `@strixun/shared-components` workspace components

## Backend pairing

Authorization API is **`@strixun/access-service`** (`serverless/access-service/worker.ts`, `main` in package.json). OTP auth worker also depends on access-service for multi-tenant auth flows.

## Failure modes

| Issue | Check |
| ----- | ----- |
| API unreachable in dev | `dev:api` / access-service wrangler on 8795 |
| Stale permissions UI | Worker KV entity rebuild; browser hard refresh after deploy |

Hosted marketing route on idling.app: `/strixun-stream-suite/access-hub` (shell only — behavior is suite source).

---

**Sources (audited):** `strixun-stream-suite/apps/access-hub/package.json`, `strixun-stream-suite/serverless/access-service/package.json`, `strixun-stream-suite/serverless/access-service/worker.ts`