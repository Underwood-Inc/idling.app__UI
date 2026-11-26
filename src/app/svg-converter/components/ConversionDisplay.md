---
title: ConversionDisplay
description: Preview and download panel for the active conversion
---

# ConversionDisplay

## Props

| Prop | Role |
|------|------|
| `result` | `ConversionResult` from page state |
| `onNewConversion` | Clears flow for another run |

## Behavior

Creates object URL from `result.blob` for `<img>` preview; revokes on unmount. Download builds transient `<a download>` with ``${filename}.png``. Shows dimension, size delta, and timing stats from `result`.

---

**Sources:** `src/app/svg-converter/components/ConversionDisplay.tsx`, `src/app/svg-converter/page.tsx`