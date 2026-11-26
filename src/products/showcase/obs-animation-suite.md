---
title: OBS Animation Suite
description: Svelte 5 PWA — Stream Suite root app for OBS layouts, cyclers, and WebSocket control
---

# OBS Animation Suite

**What this is:** Root **`strixun-stream-suite`** Vite **Svelte 5** PWA (v1.4.0 per root `package.json`) — OBS-oriented control surface for animated source transitions, text cyclers, layouts, and stream tooling. Deployed as **streamkit.idling.app**; persists settings via [Streamkit API](/products/showcase/streamkit-api).

## App entry

- **Root component:** `strixun-stream-suite/src/App.svelte` — mounts `Router.svelte`, auth stores, `initializeApp` bootstrap, animation preference store.
- **Build:** root `vite build` with `@sveltejs/vite-plugin-svelte`, `vite-plugin-pwa`
- **Description (package.json):** comprehensive OBS Studio toolkit for animations, layouts, text cycling, and stream tools

## Related packages (same monorepo)

| Concern | Package / path |
| ------- | -------------- |
| Animation easing / 3D | `@strixun/animation-utils`, `@strixun/use-3d-transform` |
| Idle overlay widgets | `@strixun/idle-game-overlay` |
| Cloud sync API | `serverless/streamkit-api` worker |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Cloud layouts empty | streamkit-api JWT + KV; OTP auth issuer |
| OBS connection drops | WebSocket modules under `strixun-stream-suite/src` (browser sources) |
| PWA stale cache | PWA plugin update strategy; hard refresh after deploy |

---

**Sources (audited):** `strixun-stream-suite/package.json`, `strixun-stream-suite/vite.config.ts`, `strixun-stream-suite/src/App.svelte`