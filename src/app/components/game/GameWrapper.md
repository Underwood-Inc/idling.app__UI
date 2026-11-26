---
title: GameWrapper
description: HTML5 canvas host for idling.app game export
---

# GameWrapper

Client shell for the legacy GameMaker HTML5 runtime: fixed canvas plus game script.

## Exports

- `GameWrapper` — named export, no props

## Render

- Container `gm4html5_div_class` / `gm4html5_div_id`
- `<canvas id="canvas" width="864" height="648">` with `GAME_WRAPPER_SELECTORS.CANVAS`
- `next/script` loads `idling.app.js?cachebust=968111397` (`GAME_WRAPPER_SELECTORS.SCRIPT`)

Styles: `styles.css`.

---

**Sources:** `src/app/components/game/GameWrapper.tsx`, `src/app/components/game/styles.css`, `src/lib/test-selectors/components/game-wrapper.selectors`