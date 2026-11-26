---
title: Auth Service
description: Multi-tenant OTP auth Cloudflare Worker with JWT, API keys, and Svelte operator UI
---

# Auth Service

**What this is:** Cloudflare Worker package **`@strixun/otp-auth-service`** (v1.1.1) — email OTP login, JWT issuance, API key management, analytics, and embedded Svelte landing/admin UI. Central identity hub for Stream Suite Workers and React apps.

## Worker entry

- **Main:** `strixun-stream-suite/serverless/otp-auth-service/worker.ts` (package `main`)
- **Bundle:** `esbuild worker.ts` → `dist/worker.js` with HTML/CSS loaders
- **Local dev:** worker port **8787**; `dev:all` can include customer-api
- **Shared exports:** `./shared/*` built via `build:shared` for other workers and login widgets

## Stack (package.json)

Depends on `@strixun/api-framework`, `@strixun/access-service`, `@strixun/auth-store`, `@strixun/kv-entities`, `@strixun/otp-login`, `@strixun/shared-components`, feature flags, KV entities; Svelte 5 operator UI (`src/App.svelte`).

## Failure modes

| Issue | Check |
| ----- | ----- |
| Suite-wide 401 | `JWT_SECRET` / `JWT_ISSUER` must match streamkit-api, url-shortener, access-service wrangler env |
| OTP email not sent | Worker secrets + provider bindings in wrangler |
| Landing asset stale | `pnpm build` before deploy (Vite + `build-landing-assets.js`) |

---

**Sources (audited):** `strixun-stream-suite/serverless/otp-auth-service/package.json`, `strixun-stream-suite/serverless/otp-auth-service/worker.ts`