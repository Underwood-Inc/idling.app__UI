---
title: AmbientSkyHorizonScene
description: Clips ambient sky to a horizon ratio with optional reflection and middle children
---

# AmbientSkyHorizonScene

Splits the ambient sky into a sky band and optional water reflection, with a slot for content between them (e.g. WebGL).

## Constants

- `AMBIENT_HORIZON_CLIP_BOTTOM_VAR` — CSS var for clip bottom offset.
- `AMBIENT_HORIZON_WATER_RATIO_VAR` — normalized water band height.

## `buildAmbientHorizonClipStyle(horizonRatio)`

Clamps ratio to `[0.05, 0.95]`, sets both CSS custom properties for module styles.

## Components

### `AmbientSkyHorizonSceneProps`

- `horizonRatio: number` — water band height as fraction from bottom (0–1); sky is the remainder.
- `reflect?: boolean` — default `true`; when false, skips reflection layer.
- `children?: ReactNode` — rendered between sky and reflection.

Renders fragment: sky layer → `children` → optional reflection.

### `AmbientSkyHorizonLayerProps`

- `horizonRatio`, `variant: 'sky' | 'reflection'`

Uses `useAmbientStarfield()` internally. Sky: `skyHorizon__sky` + `AmbientSkyEffectsLayer`. Reflection: `skyHorizon__reflection` with inner wrapper and mirrored effects.

`data-testid`: `ambient-sky-horizon-sky` / `ambient-sky-horizon-reflection`.

## Exports

`AmbientSkyHorizonScene`, `AmbientSkyHorizonLayer`, `buildAmbientHorizonClipStyle`, horizon CSS var constants, prop types (via barrel).

---

**Sources:** `src/app/components/ambient-background/AmbientSkyHorizonScene.tsx`