---
title: VisualizerModeOverlay
description: Routes fullscreen visualizer implementation by source mode
---

# VisualizerModeOverlay

When `isActive`, selects among three fullscreen renderers based on `fullscreenSource` and `spectrumEnabled`:

| Source | Component |
|--------|-----------|
| `spectrum` | `RadioVisualizerFullscreen` (AudioMotion spectrum) |
| `bar` | `RadioBarVisualizerFullscreen` |
| `webgl` | `RadioWebglVisualizerFullscreen` (skipped when capability resolves unsupported) |

Reads preset index, opacity, bar height, gradient map, WebGL preset/motion, and capability from `useVisualizerMode`.

---

**Sources:** `src/app/components/visualizer-mode/VisualizerModeOverlay.tsx`, `@widgets/radio-player/radioVisualizerPresets`