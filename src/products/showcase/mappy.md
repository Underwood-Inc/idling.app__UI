---
title: mappy
description: Offline-first Tauri map platform — markers, packs, search, and authoring
---

# mappy

**What this is:** **mappy** desktop app (`apps/mappy`, v1.81.x) — offline-first interactive maps for open-world games and custom realms. Primary shell is **Tauri**; legacy **Electron** `main.mjs` remains for transitional builds. Static map data only — no application backend for gameplay state.

## Runtime entry

- **Package:** `apps/mappy/package.json` — engines Node ≥22, pnpm ≥10.
- **Tauri:** `apps/mappy/src-tauri/tauri.conf.json` (desktop binary).
- **Web UI:** Vite-built SPA shipped inside the shell; Official Map Packs download separately (see [mappy-maps-cdn](/products/ensemble/mappy-maps-cdn)).

## Operator / player model (source)

- Marker corpus, progress tracking, unified search (`!` `@` `#` token conventions in mappy docs), measure tools, Tile Studio / Marker Maker authoring.
- White-label synthetic demo ships in-repo; paid or third-party packs via release artifacts and CDN catalog.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Pack won't open | `.mappymap` version vs app version; catalog `packUrl` |
| Tiles missing | Local tile cache path; official pack install |
| Electron vs Tauri mismatch | `package.json` `main` and active build target scripts |

Wiki: `https://underwood-inc.github.io/mappy/wiki/` (marketing link only — verify against `apps/mappy` when behavior differs).

---

**Sources (audited):** `apps/mappy/package.json`, `apps/mappy/src-tauri/tauri.conf.json`