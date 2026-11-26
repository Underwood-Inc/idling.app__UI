---
title: Customer API
description: Cloudflare Worker for encrypted customer profile data
---

# Customer API

**What this is:** Cloudflare Worker **`strixun-customer-api`** — tenant customer records in KV with JWT-authenticated, encrypted responses. Consumed by OTP auth flows and suite frontends that need profile data without exposing emails across workers.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/customer-api/package.json` (v1.0.1)
- **Main:** `worker.ts` → `dist/worker.js` via esbuild
- **Dev:** `wrangler dev --port 8790 --local --env development`
- **Production route:** `customer-api.idling.app/*` (`wrangler.toml`)

## Bindings

| Binding | Role |
| ------- | ---- |
| `CUSTOMER_KV` | Customer entity storage |
| `AUTH_SERVICE` | Service binding to `otp-auth-service` (JWKS) |

## Failure modes

| Issue | Check |
| ----- | ----- |
| 401 on `/health` | HttpOnly `auth_token` cookie present (encryption required on all routes) |
| JWKS fetch 522 | `AUTH_SERVICE` binding vs public `auth.idling.app` |

Related: [Auth Service](/products/showcase/auth-service), [Access API](/products/ensemble/access-api).

---

**Sources (audited):** `strixun-stream-suite/serverless/customer-api/package.json`, `strixun-stream-suite/serverless/customer-api/worker.ts`, `strixun-stream-suite/serverless/customer-api/wrangler.toml`