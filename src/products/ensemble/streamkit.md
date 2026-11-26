---
title: Streamkit
description: OBS Animation Suite PWA plus Streamkit API worker — cloud layouts and cyclers
---

# Streamkit

**What this is:** Product pair inside **strixun-stream-suite** — Svelte **OBS Animation Suite** frontend (root app) and **`strixun-streamkit-api`** Cloudflare Worker for authenticated cloud storage of layouts, text cyclers, swaps, notes, and scene activity.

## Frontend entry

- **App:** `strixun-stream-suite/src/App.svelte` + Vite PWA build (`strixun-stream-suite/package.json`)
- **Live:** `https://streamkit.idling.app` (marketing `projectShowcaseProjects.ts` → OBS Animation Suite card)

## API entry

- **Worker:** `strixun-stream-suite/serverless/streamkit-api/worker.ts` → `dist/worker.js`
- **Wrangler name:** `strixun-streamkit-api`; KV binding `STREAMKIT_KV`
- **Auth:** JWT from `@strixun/otp-auth-service` (`JWT_SECRET` / `JWT_ISSUER` must match)

## Failure modes

| Issue | Check |
| ----- | ----- |
| Login works but sync fails | streamkit-api env secrets vs OTP worker |
| Local dev empty cloud | `wrangler dev` port 8796 + OTP on 8787 |

Deep dive pages: [OBS Animation Suite](/products/showcase/obs-animation-suite), [Streamkit API](/products/showcase/streamkit-api).

---

**Sources (audited):** `strixun-stream-suite/package.json`, `strixun-stream-suite/src/App.svelte`, `strixun-stream-suite/serverless/streamkit-api/wrangler.toml`, `strixun-stream-suite/serverless/streamkit-api/worker.ts`