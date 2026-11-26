---
title: Astral Hearth
description: Orbiting-globe 3D alert visualization with Vite frontend and Socket.IO backend
---

# Astral Hearth

**What this is:** **`astral-hearth/typescript-version`** — npm package name **`orbiting-globe`** — 3D visualization of alerts as orbiting orbs. Vite frontend plus Express + Socket.IO backend (`src/server.ts`); optional Docker compose workflows in package scripts.

## Runtime entry

- **Package:** `astral-hearth/typescript-version/package.json`
- **Backend:** `astral-hearth/typescript-version/src/server.ts` — HTTP server, Socket.IO, routers `idle-game`, `universe-integrity`, `og-image`
- **Frontend dev:** Vite port **3001**; WS port **5173** in `dev:backend` script
- **Shared parser copy:** `astral-hearth/packages/search-query-parser` (sibling to suite package)

## Build

`build` runs boat prefab generation, Vite client build, and server bundle (`vite.server.config.ts`). Windows binary target via `pkg` on `dist/server/server.cjs`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| WS disconnect | `WS_PORT` env alignment between client and `server.ts` |
| Docker dev mismatch | `docker:dev` compose vs local `dev:docker` ports |

Not on homepage showcase carousel — ensemble doc for historical stream/alert experiments.

---

**Sources (audited):** `astral-hearth/typescript-version/package.json`, `astral-hearth/typescript-version/src/server.ts`