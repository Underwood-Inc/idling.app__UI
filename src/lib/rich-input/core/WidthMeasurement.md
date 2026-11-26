---
title: WidthMeasurement
description: DOM measurement cache for rich-input token widths
---

# WidthMeasurement

`WidthMeasurementUtility` measures per-token and character widths in the contenteditable mirror DOM.

## Types

- **`MeasurementContext`** — Element refs and font context.
- **`TokenWidthData`** — Cached width per token id.

## Export

- **`widthMeasurement`** — Singleton used by cursor/click positioning helpers.

Reduces layout thrash when mapping text indices to screen coordinates.

---

**Sources:** `src/lib/rich-input/core/WidthMeasurement.ts`