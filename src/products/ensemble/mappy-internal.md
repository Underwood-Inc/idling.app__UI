---
title: mappy (internal)
description: Maintainer source for offline-first mappy — Tauri primary, MapLibre PWA, official map pack tooling
---

# mappy (internal)

**What this is:** the **Underwood-Inc/mappy-internal** repo — authoritative maintainer tree for **mappy** (`package.json` v**1.81.1**, `appId` `inc.underwood.mappy`). Same product as public [mappy](/products/showcase/mappy); public releases ship from [Underwood-Inc/mappy](https://github.com/Underwood-Inc/mappy), not this clone URL.

Offline-first MapLibre map platform: marker corpus, search, measure, progress filters, **static files only** (no app backend). Production installers bundle a **white-label synthetic demo**; Official Map Packs and `.mappymap` imports ship separately.

## Runtime entry

- **HTML:** `index.html` → `/src/main.ts`
- **Bootstrap:** `src/main.ts` — boot placeholder, i18n (`initMappyI18nAsync`), persistent KV, Tauri shell (`installTauriMappyShellIfPresent`), `registerMappyUi` + `registerMappyAppRootElement`
- **Bundler:** `vite.config.ts` — Svelte + React islands, PWA (`vite-plugin-pwa`), version from `MAPPY_APP_VERSION` or `package.json`
- **Desktop primary:** Tauri 2 (`pnpm tauri:dev`, `src-tauri/`) — Workbox skipped on Tauri webview to avoid stale precache
- **Legacy:** Electron wrapper (`electron/main.mjs`, `pnpm electron:dev`)

## Prerequisites (`README.md`)

Node **≥22**, pnpm **≥10**, Rust for Tauri, `public/` git submodule (`pnpm submodule:public`).

## Maintainer scripts (selected)

| Script | Role |
| ------ | ---- |
| `pnpm dev` | Vite at `http://127.0.0.1:5173` |
| `pnpm tauri:dist:win` | Signed NSIS desktop build |
| `pnpm official-maps:publish` | Official map pack publish pipeline |
| `pnpm verify` | `check:static` + Vitest |

Traceability: `requirements/` registry (**182** IDs per README), `.traceability.yaml`, `pnpm trace:audit`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Empty map tiles | `public/` submodule init |
| Stale UI on Tauri rebuild | PWA registration intentionally skipped in `src/main.ts` for Tauri |
| CI quality gate | `.github/workflows/quality-gate.yml` |

## Ensemble links

Public carousel / downloads: [mappy showcase](/products/showcase/mappy). CDN catalog: [mappy-maps-cdn](/products/ensemble/mappy-maps-cdn).

---

**Sources (audited):** `mappy-internal/package.json`, `mappy-internal/index.html`, `mappy-internal/src/main.ts`, `mappy-internal/vite.config.ts`, `mappy-internal/README.md`