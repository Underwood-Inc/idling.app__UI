---
title: ambientBackground.utils
description: Starfield types, viewport tier counts, and CSS style mapping for ambient stars
---

# ambientBackground.utils

Pure utilities for generating and styling the ambient starfield (no React).

## Types

- `AmbientStarTier`: `'twinkle' | 'cross' | 'spark'`
- `AmbientStarTone`: `'warm' | 'cool' | 'pink'`
- `AmbientStar`, `AmbientStarfield`, `AmbientStarfieldCounts`, `AmbientStarStyle` (CSS vars for opacity, rotation, optional flare size).

## Exports

| Function | Role |
|----------|------|
| `getAmbientStarfieldCounts(viewportWidth)` | Breakpoints: `<768`, `<1280`, else desktop — returns dust/medium/twinkle/cross/spark counts. |
| `createAmbientStarfield(counts)` | Builds `dustBoxShadow` and `mediumBoxShadow` via `box-shadow` strings; creates tiered `animatedStars` with randomized position, timing, opacity, tone. |
| `ambientStarToStyle(star)` | Maps star to inline style + custom properties for CSS animations. |
| `getAmbientDotCount` | **Deprecated** — sum of twinkle + cross + spark from counts. |

## Randomness

`pickTone()` skews warm (~55%), cool (~27%), pink (~18%). Spark tier biases tone toward pink/cool. Box-shadow “dust” uses warm/cool RGB with random alpha.

## Edge cases

- Each call to `createAmbientStarfield` produces new random positions (not seeded).
- `buildBoxShadow` returns empty string when `count` is 0.

---

**Sources:** `src/app/components/ambient-background/ambientBackground.utils.ts`