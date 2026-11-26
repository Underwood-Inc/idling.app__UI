---
title: ConversionHistory
description: Selectable list of prior SVG conversions in the session
---

# ConversionHistory

## Props

| Prop | Role |
|------|------|
| `conversions` | History array |
| `currentResult` | Highlights selection |
| `onSelectConversion` | Recall a prior result |
| `onClearHistory` | Wipes list |

## UX

Each row shows filename, relative time (`formatTime`), size summary, quick download (stop propagation), and active state when matching `currentResult.id`. Empty state copy in module CSS.

---

**Sources:** `src/app/svg-converter/components/ConversionHistory.tsx`, `src/app/svg-converter/page.tsx`