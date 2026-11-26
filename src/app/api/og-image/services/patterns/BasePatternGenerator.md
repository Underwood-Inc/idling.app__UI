---
title: BasePatternGenerator
description: Seeds procedural OG background layers
---

# BasePatternGenerator

## `generateBackgroundPattern(seed, width, height, shapeCount?)`

`seededRandom(seed)` drives palette pick, gradient base, and 5–8 (or clamped `shapeCount`) layers. Delegates layer geometry to:

- `ShapePatternGenerator`
- `LinePatternGenerator`
- `OrganicPatternGenerator`

Returns `BackgroundPatternResult` — concatenated SVG snippet string plus `predominantColor` from usage counts.

---

**Sources:** `src/app/api/og-image/services/patterns/BasePatternGenerator.ts`