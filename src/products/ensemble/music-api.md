---
title: Music API
description: Cloudflare Worker proxy for copyright-free music search
---

# Music API

**What this is:** Cloudflare Worker **`strixun-music-api`** — fetches and exposes copyright-free music tracks from external catalogs for stream production tooling (no JWT requirement on health; route handlers in `router/music-routes.js`).

## Worker entry

- **Package:** `strixun-stream-suite/serverless/music-api/package.json` (v1.0.0)
- **Main:** `worker.ts` (v1.1.0) → `dist/worker.js`
- **Dev:** `wrangler dev --port 8791 --local --env development`
- **Production host:** `music-api.idling.app` (routes listed in `[vars].ROUTES` JSON in `wrangler.toml`)

## Health

`GET /health` returns JSON `{ service: 'strixun-music-api', status: 'ok' }` without auth.

## Failure modes

| Issue | Check |
| ----- | ----- |
| CORS blocked in browser | `ALLOWED_ORIGINS` in development vs production vars |
| Upstream source errors | Router handlers and external API quotas (see worker routers) |

---

**Sources (audited):** `strixun-stream-suite/serverless/music-api/package.json`, `strixun-stream-suite/serverless/music-api/worker.ts`, `strixun-stream-suite/serverless/music-api/wrangler.toml`