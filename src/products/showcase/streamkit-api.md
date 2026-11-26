---
title: Streamkit API
description: Cloudflare Worker — cloud storage for Streamkit layouts, cyclers, and scene activity
---

# Streamkit API

**What this is:** Cloudflare Worker **`strixun-streamkit-api`** — dedicated KV-backed API for Streamkit cloud storage (text cyclers, swaps, layouts, notes, scene activity). Authenticates with JWT from OTP auth service.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/streamkit-api/package.json`
- **Bundle:** `esbuild worker.ts` → `dist/worker.js` (`build:worker`)
- **Deploy:** `wrangler deploy` / `wrangler.toml` name `strixun-streamkit-api`
- **Local dev:** port **8796** (`wrangler dev --env development`)

## Configuration (`wrangler.toml`)

- `STREAMKIT_KV` namespace binding
- `JWT_SECRET`, `JWT_ISSUER` must align with `@strixun/otp-auth-service` (documented in wrangler comments)
- Optional: `ALLOWED_ORIGINS`, `SERVICE_API_KEY`, `NETWORK_INTEGRITY_KEYPHRASE`

## Dependencies

Workspace: `@strixun/api-framework`, `@strixun/schemas`, `@strixun/kv-entities`, `@strixun/service-client`, `@strixun/types`, `@strixun/error-utils`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| 401 on all routes | JWT secret/issuer mismatch vs OTP worker |
| Empty layouts after deploy | KV namespace binding for target environment |
| CORS in production | `ALLOWED_ORIGINS` secret |

Pairs with OBS Animation Suite frontend at `https://streamkit.idling.app`.

---

**Sources (audited):** `strixun-stream-suite/serverless/streamkit-api/package.json`, `strixun-stream-suite/serverless/streamkit-api/wrangler.toml`, `strixun-stream-suite/serverless/streamkit-api/worker.ts`