---
title: ShapePatternGenerator
description: Primitive shape scatter for OG backgrounds
---

# ShapePatternGenerator

## `generateShapePattern(layerType, ...)`

Dispatches on `layerType` bands to generators: circles, hexagons, stars, triangles, ellipses, crosses, arcs.

Each helper pushes SVG elements with randomized position, size, and opacity; increments `colorUsage[layerColor]`.

---

**Sources:** `src/app/api/og-image/services/patterns/ShapePatternGenerator.ts`