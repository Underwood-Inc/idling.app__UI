---
title: RadioPwaStandaloneVisualizerBootstrap
description: Auto-enables visualizer in standalone radio PWA
---

# RadioPwaStandaloneVisualizerBootstrap

For standalone PWA only (`isStandalonePwa`): enables spectrum via `setSpectrumEnabled(true)` and calls `enterVisualizerMode()` when inactive. Uses `useLayoutEffect` so first paint matches radio-first experience. Returns `null`.

---

**Sources:** `src/app/components/radio-pwa/RadioPwaStandaloneVisualizerBootstrap.tsx`, `@lib/context/VisualizerModeContext`