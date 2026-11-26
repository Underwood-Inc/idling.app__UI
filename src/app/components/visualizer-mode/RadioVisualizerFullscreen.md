---
title: RadioVisualizerFullscreen
description: AudioMotion spectrum fullscreen visualizer
---

# RadioVisualizerFullscreen

Props: `isActive`, `enabled`, `opacity`, `barHeight`, `preset` (`RadioVisualizerPreset`), `spectrumGradientByPreset`.

Connects to `useRadioPlayer` analyser via `waitForRadioAnalyser`, instantiates `AudioMotionAnalyzer` with preset-specific gradients (`registerRadioVisualizerGradients`), rounded peak drawing when enabled, peak auto-gain, and layout sync on resize. Canvas sizing follows container `clientWidth` / `clientHeight`.

Styles: `VisualizerMode.module.css`.

---

**Sources:** `src/app/components/visualizer-mode/RadioVisualizerFullscreen.tsx`, `@widgets/radio-player/radioVisualizerPresets`