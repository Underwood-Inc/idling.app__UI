---
title: usePersistedRadioFullscreenDisplay
description: Persisted fullscreen radio visualizer settings
---

# usePersistedRadioFullscreenDisplay

Loads/saves `RadioFullscreenVisualizerDisplay` from widget persistence helpers.

Exposes `display`, `isLoaded`, and setters: spectrum enable/opacity/preset, fullscreen source, WebGL preset, constellation motion, bar height, per-preset gradient.

Clamps values via widget `clamp*` helpers before save.

---

**Sources:** `src/lib/hooks/usePersistedRadioFullscreenDisplay.ts`, `@widgets/radio-player/radioFullscreenVisualizerDisplay`