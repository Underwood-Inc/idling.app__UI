---
title: useWebglVisualizerCapability
description: Detect WebGL support for radio fullscreen visualizer
---

# useWebglVisualizerCapability

Returns `WebglVisualizerCapabilityState`: `isResolved`, `isSupported`, `reason`.

Runs `detectWebglVisualizerCapability` on mount and when document visibility changes (SSR starts unresolved).

---

**Sources:** `src/lib/hooks/useWebglVisualizerCapability.ts`, `@widgets/radio-player/webgl/detectWebglVisualizerCapability`