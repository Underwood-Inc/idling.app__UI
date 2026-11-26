---
title: Dice Board Game
description: Embeddable React + Three.js hex board and dice library for suite overlays
---

# Dice Board Game

**What this is:** Monorepo package **`@strixun/dice-board-game`** (`strixun-stream-suite/apps/dice-board-game`) — a **library**, not a deployed hostname. It provides hexagonal board generation, procedural events, dice simulation, and **React Three Fiber** UI (`DiceBoardGameContainer`). [Mods Hub](/products/showcase/mods-hub) lazy-loads the React entry from the admin panel; persistence can target [Game API](/products/ensemble/game-api) when wired by the host app.

## Package surface

- **Core exports:** `apps/dice-board-game/index.ts` re-exports types, `board-generator`, `dice-engine`, `event-generator`, `game-state`, `hex-math`
- **React exports:** `apps/dice-board-game/react/index.tsx` → `DiceBoardGame`, `DiceBoardGameContainer`
- **Build:** `tsc -b && vite build` → `strixun-stream-suite/dist/dice-board-game/` (see `exports` map in package.json for `./dist` and `./react/dist`)
- **Stack:** React 19, Three.js, `@react-three/fiber`, `@react-three/drei`, Zustand

## Core modules

| Module | Role |
| ------ | ---- |
| `src/core/board-generator.ts` | Procedural hex board, forks, edge wrap |
| `src/core/dice-engine.ts` | Roll simulation / dice config |
| `src/core/event-generator.ts` | Procedural tile events |
| `src/core/game-state.ts` | Player movement, inventory, buffs, save-shaped state |
| `src/utils/hex-math.ts` | Axial hex coordinates and distance |

## Consumer integration

**Workspace dependency:** `apps/mods-hub/package.json` → `@strixun/dice-board-game`

**Dynamic import:** `apps/mods-hub/src/pages/AdminPanel.tsx` loads `@strixun/dice-board-game/react` on demand.

**Dev / preview:**

```text
pnpm --filter @strixun/dice-board-game dev
```

`vite` serves the package for local iteration; embed hosts pass `width` / `height`, board `config`, and `diceConfig` (see package `README.md`).

## Modes (design intent)

- **Standalone** — Vite dev or any React host importing the container
- **Overlay** — attach to a DOM ref for border-style embedding (documented in repo README)
- **Game API** — state hooks intended for worker-backed save/load when the host connects [Game API](/products/ensemble/game-api)

Part of [Stream Suite](/products/stream-suite) embeddable apps (library tier, not carousel).

---

**Sources (audited):** `strixun-stream-suite/apps/dice-board-game/package.json`, `strixun-stream-suite/apps/dice-board-game/index.ts`, `strixun-stream-suite/apps/dice-board-game/react/index.tsx`, `strixun-stream-suite/apps/dice-board-game/src/core/game-state.ts`, `strixun-stream-suite/apps/mods-hub/package.json`, `strixun-stream-suite/apps/mods-hub/src/pages/AdminPanel.tsx`