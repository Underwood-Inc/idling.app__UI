---
title: AmbientSkyEffectsLayer
description: Composed nebula, aurora, depth, audio-reactive pulses, and starfield
---

# AmbientSkyEffectsLayer

Shared decorative sky stack for full-page background and horizon clips.

## Props

`AmbientSkyEffectsLayerProps`:

- `starfield: AmbientStarfield` — passed through to `AmbientStarfieldLayer`.

## Layers (CSS module)

Inside `styles.skyEffects` (`aria-hidden="true"`):

1. **Nebula** — three cloud variants (violet, gold, teal).
2. **Audio reactive** — bass/mid/treble pulse placeholders (visual only; not wired to live audio in this file).
3. **Depth** — three parallax-style layers.
4. **Aurora** — primary/secondary washes.
5. **AmbientStarfieldLayer** — stars from prop.

## Exports

Named export `AmbientSkyEffectsLayer`.

---

**Sources:** `src/app/components/ambient-background/AmbientSkyEffectsLayer.tsx`