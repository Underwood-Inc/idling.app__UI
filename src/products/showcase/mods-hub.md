---
title: Mods Hub
description: React 19 mod hosting UI with Mods API, R2 storage, and OTP auth
---

# Mods Hub

**What this is:** Vite **React 19** app **`@strixun/mods-hub`** — full-stack mod hosting UI with Lexical rich editor, advanced search (`@strixun/search-query-parser`), P2P storage hooks, and workspace integration with Mods API, OTP auth, and customer API workers.

## App entry

- **Package:** `strixun-stream-suite/apps/mods-hub/package.json`
- **Dev:** `vite`; `dev:all` runs frontend + `strixun-mods-api` + `@strixun/otp-auth-service` + customer-api concurrently
- **Build:** `prebuild` builds api-framework, otp-login, p2p-storage, chat; then `tsc -b && vite build`
- **Router:** React Router 7; TanStack Query; Zustand stores

## Backend pairing

- **Mods API:** `strixun-stream-suite/serverless/mods-api` — [Mods API](/products/ensemble/mods-api) (`mods-api.idling.app`)
- **Auth:** `@strixun/otp-auth-service` for login widgets (`@strixun/otp-login` React build)

## Failure modes

| Issue | Check |
| ----- | ----- |
| Search syntax errors | `parseSearchQuery` from workspace parser package |
| Upload failures | Mods API secrets; R2 bindings in worker wrangler |
| Auth widget missing | `predev` otp-login React build step |

Live: `https://mods.idling.app` (marketing link in `projectShowcaseProjects.ts`).

---

**Sources (audited):** `strixun-stream-suite/apps/mods-hub/package.json`