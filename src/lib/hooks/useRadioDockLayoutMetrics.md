---
title: useRadioDockLayoutMetrics
description: CSS variables for radio dock geometry
---

# useRadioDockLayoutMetrics

Observes `playerRef` and `rowRef` with `ResizeObserver`, writes layout CSS vars on `document.documentElement`:

`--irp-bar-height`, `--irp-dock-height`, `--irp-dock-top`, `--irp-dock-bottom-gap`, `--irp-viewport-inline-size`, scrollbar width, etc.

`expanded` flag adjusts measurement when dock is expanded.

---

**Sources:** `src/lib/hooks/useRadioDockLayoutMetrics.ts`