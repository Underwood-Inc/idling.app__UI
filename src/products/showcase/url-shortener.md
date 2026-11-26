---
title: URL Shortener
description: Cloudflare Worker short links with OTP auth, analytics, and bundled web UI
---

# URL Shortener

**What this is:** Cloudflare Worker **`strixun-url-shortener`** — short link creation/resolution, click analytics, OTP-gated admin, and a standalone Vite app bundle served from the worker assets pipeline.

## Worker entry

- **Package:** `strixun-stream-suite/serverless/url-shortener/package.json` (v1.1.0)
- **Bundle:** `esbuild worker.ts` → `dist/worker.js`
- **Build chain:** `build:all` — api-framework deps, OTP shared bundles, `app/` Vite build, asset scripts, worker bundle
- **Local dev:** port **8793** (`wrangler dev --env development`)

## Dependencies

`@strixun/api-framework`, `@strixun/auth-store`, `@strixun/oidc-jwt`, `@strixun/service-client`, `@strixun/types`, `@strixun/error-utils`, `@strixun/e2e-helpers`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Admin UI 404 | Run full `build:all` before `dev`/`deploy` (app assets embedding) |
| Auth loop | OTP auth worker origin + JWT alignment |
| Short link 302 wrong target | Worker route handler + KV record |

Public short domain used in marketing: `https://short.army/...` (verify live mapping in worker config).

---

**Sources (audited):** `strixun-stream-suite/serverless/url-shortener/package.json`, `strixun-stream-suite/serverless/url-shortener/worker.ts`