---
title: AmbientStarfieldLayer
description: Renders dust/medium box-shadow star fields and animated star DOM nodes
---

# AmbientStarfieldLayer

Visual star layer used inside `AmbientSkyEffectsLayer` (and reflected horizon bands).

## Props

`AmbientStarfieldLayerProps`:

- `starfield: AmbientStarfield`

## Markup

- Container: `styles.stars`
- Dust/medium: single `span` each with `boxShadow` from `starfield.dustBoxShadow` / `mediumBoxShadow` (omitted when string is empty).
- Animated stars: one `span` per `animatedStars` entry with tier/tone CSS modules (`star--twinkle`, `star--cross`, `star--spark`, tone variants).
- **cross** tier adds inner `star__flare`; **spark** adds `star__spark`.
- Inline styles from `ambientStarToStyle(star)`.

## Exports

Named export `AmbientStarfieldLayer`.

---

**Sources:** `src/app/components/ambient-background/AmbientStarfieldLayer.tsx`