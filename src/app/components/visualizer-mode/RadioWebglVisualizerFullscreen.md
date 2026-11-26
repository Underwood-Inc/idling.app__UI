---
title: RadioWebglVisualizerFullscreen
description: WebGL neon constellation fullscreen visualizer
---

# RadioWebglVisualizerFullscreen

Props: `isActive`, `enabled`, `opacity`, `presetId`, `constellationMotion`, `capability` (`WebglVisualizerCapabilityState`).

Creates and tears down `createWebglVisualizerEngine` on a canvas host, feeding analyser data from `useRadioPlayer`. Normalizes preset and motion ids; applies theme uniforms via `resolveWebglVisualizerThemeUniforms`. Composites `AmbientSkyHorizonLayer` at `STARRY_HORIZON_Y` for horizon alignment.

Respects capability probe — avoids starting engine when WebGL is unavailable.

---

**Sources:** `src/app/components/visualizer-mode/RadioWebglVisualizerFullscreen.tsx`, `@widgets/radio-player/webgl/createWebglVisualizerEngine`