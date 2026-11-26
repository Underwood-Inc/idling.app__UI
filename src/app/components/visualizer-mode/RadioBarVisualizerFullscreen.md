---
title: RadioBarVisualizerFullscreen
description: Canvas bar-wave fullscreen visualizer
---

# RadioBarVisualizerFullscreen

Props: `isActive`, `enabled`, `opacity`, `barHeight`.

Uses bar preset layout from `getBarVisualizerFullscreenLayout`, visual height ratio from `resolveRadioFullscreenVisualHeightRatio`, and radio analyser data to draw bar waves on canvas. Schedules layout sync when the radio handle becomes available.

---

**Sources:** `src/app/components/visualizer-mode/RadioBarVisualizerFullscreen.tsx`, `@widgets/radio-player/barVisualizerPresets`