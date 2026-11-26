---
title: Suite API
description: Legacy Stream Suite cloud storage worker at api.idling.app
---

# Suite API

**What this is:** Cloudflare Worker **`strixun-suite-api`** — Stream Suite backend for cloud notes, OBS credential helpers, scrollbar CDN assets, and legacy auth-compatible routes. Hostname **`api.idling.app`**. Overlaps conceptually with [Streamkit API](/products/showcase/streamkit-api) (OBS layout KV) but remains a separate worker in the monorepo deploy graph.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/suite-api/package.json` (v1.1.0)
- **Main:** `worker.ts` (v2.2.0) → `dist/worker.js`, routes via `./router`
- **Dev:** `wrangler dev --port 8789 --local --env development`
- **Production route:** `api.idling.app/*`

## Bindings

| Binding | Role |
| ------- | ---- |
| `SUITE_CACHE` | KV for suite cloud blobs and cache |
| `AUTH_SERVICE` | JWKS from `otp-auth-service` |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Streamkit vs suite API confusion | `streamkit-api.idling.app` is OBS layout sync; `api.idling.app` is suite-api router |
| CORS from new app origin | `ALLOWED_ORIGINS` in `wrangler.toml` production vars |

---

**Sources (audited):** `strixun-stream-suite/serverless/suite-api/package.json`, `strixun-stream-suite/serverless/suite-api/worker.ts`, `strixun-stream-suite/serverless/suite-api/wrangler.toml`