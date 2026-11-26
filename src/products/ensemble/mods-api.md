---
title: Mods API
description: Cloudflare Worker backend for Mods Hub uploads and downloads
---

# Mods API

**What this is:** Cloudflare Worker **`strixun-mods-api`** — mod metadata in KV, encrypted artifacts in R2, semver and download counters (Durable Object). Powers [Mods Hub](/products/showcase/mods-hub) at `mods.idling.app`; not a homepage card.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/mods-api/package.json` (v1.0.1)
- **Main:** `worker.ts` (worker header v2.2.0) → `dist/worker.js`
- **Dev:** `wrangler dev --port 8788 --local --env development`
- **Production route:** `mods-api.idling.app/*`

## Bindings

| Binding | Role |
| ------- | ---- |
| `MODS_KV` | Mod catalog and version metadata |
| `MODS_R2` | Encrypted mod file blobs (`mods-storage`) |
| `OTP_AUTH_KV` | Shared auth session lookups where needed |
| `DOWNLOAD_COUNTER` | Durable Object for analytics |
| `AUTH_SERVICE` | JWKS via `otp-auth-service` binding |

Upload permissions flow through [Access API](/products/ensemble/access-api), not env allowlists.

## Ops notes

- Daily cron (`0 2 * * *`) runs R2 cleanup for soft-deleted files (`wrangler.toml` `[triggers]`).
- Requires `MODS_ENCRYPTION_KEY` and matching `JWT_SECRET` secrets in production.

---

**Sources (audited):** `strixun-stream-suite/serverless/mods-api/package.json`, `strixun-stream-suite/serverless/mods-api/worker.ts`, `strixun-stream-suite/serverless/mods-api/wrangler.toml`