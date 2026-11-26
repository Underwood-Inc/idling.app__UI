---
title: useRadioMetaWidth
description: Resizable now-playing meta column width
---

# useRadioMetaWidth

Persists meta block width via `radioMetaWidthPreferences`. Returns `metaWidthPx`, `isResizing`, `beginResize(clientX)`, `resetWidth`.

Clamps against row width and `RADIO_META_WIDTH_RANGE_PX`. `isFullscreen` affects measurement context.

---

**Sources:** `src/lib/hooks/useRadioMetaWidth.ts`, `@widgets/radio-player/radioMetaWidthPreferences`