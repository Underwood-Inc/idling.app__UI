---
title: LinePatternGenerator
description: Line-based SVG pattern layers
---

# LinePatternGenerator

## `generateLinePattern(layerType, ...)`

Branches on `layerType` threshold:

- lines (`<line>` scatter)
- spirals
- zigzags
- dots/dashes

Mutates shared `patterns: string[]` and `colorUsage` map. Opacity scales from `layerOpacity` and per-element randomness.

---

**Sources:** `src/app/api/og-image/services/patterns/LinePatternGenerator.ts`