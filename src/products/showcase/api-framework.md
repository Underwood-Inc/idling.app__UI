---
title: API Framework
description: Shared HTTP client and router utilities for Cloudflare Workers and browsers
---

# API Framework

**What this is:** Workspace package **`@strixun/api-framework`** — shared request client, enhanced router, JWT helpers, and test utilities used across Strixun Stream Suite Workers and React apps.

:::tip Offline Connectivity Engine (OCE)

**On idling.app:** OCE is vendored under `src/lib/oce/connectivity`; the app uses `idlingFetch` from `@lib/oce/idlingFetch`. **In the Strixun monorepo:** browser apps that use `secureFetch` inherit the same engine from `@strixun/api-framework/connectivity`.

The engine publishes a page-wide connectivity **hint** from real fetch outcomes (not `navigator.onLine`); it must not block UI or skip requests.

**Start here:** [Offline Connectivity Engine guide](/guides/offline-connectivity-engine/) — architecture, attach fetch, framework recipes, and deadlock avoidance.

:::

## Package entry

- **Root export:** `strixun-stream-suite/packages/api-framework/src/index.ts`
- **Subpaths:** `./enhanced`, `./client`, `./enhanced-router`, `./jwt`, `./test-utils`, `./connectivity` (browser OCE; `package.json` `exports`)
- **Build:** `tsc` → `dist/`; Vitest for unit coverage

## Surface (index exports)

- `APIClient`, `createAPIClient`, singleton getters/setters
- Types: `APIRequest`, `APIResponse`, `APIError`, middleware, retry/cache/offline configs
- Request management: `RequestDeduplicator`, `RequestQueue`, `ConcurrencyPool`, `CancellationManager`

## Consumers

All `serverless/*` Workers in `strixun-stream-suite` list `@strixun/api-framework` as a workspace dependency (otp-auth, streamkit-api, url-shortener, access-service, chat-signaling, mods-api, …).

## Failure modes

| Issue | Check |
| ----- | ----- |
| JWT rejected across services | Shared `JWT_SECRET` / issuer vars in worker `wrangler.toml` |
| Stale types in consumer | Rebuild package before worker `pretest` / `predeploy` scripts |

---

**Sources (audited):** `strixun-stream-suite/packages/api-framework/package.json`, `strixun-stream-suite/packages/api-framework/src/index.ts`