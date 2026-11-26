---
title: clickPositioning
description: Map pointer events to caret indices in rich input
---

# clickPositioning

- **`calculateEnhancedClickPosition`** — Primary click → index with pill awareness.
- **`calculateTokenAwareClickPosition`** — Deep token hit testing.
- **`calculateCharacterPositionInToken`** — Offset inside a pill’s visual text.

Called from `useMouseHandlers` on contenteditable clicks.

---

**Sources:** `src/lib/rich-input/utils/clickPositioning.ts`