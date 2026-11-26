---
title: VisualizerModeGate
description: Lazy loader for fullscreen visualizer overlay
---

# VisualizerModeGate

Client gate on `VisualizerModeContext.isActive`. When inactive, returns `null`. When active, dynamically imports `VisualizerModeOverlay` with `ssr: false` to keep heavy visualizer bundles off the critical path.

Mounted from site chrome and radio PWA shell.

---

**Sources:** `src/app/components/visualizer-mode/VisualizerModeGate.tsx`, `@lib/context/VisualizerModeContext`