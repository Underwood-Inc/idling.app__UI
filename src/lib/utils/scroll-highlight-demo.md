---
title: scroll-highlight-demo
description: Example wrappers around applyScrollHighlight presets
---

# scroll-highlight-demo

Demonstration helpers for the scroll-highlight animation system (`scroll-highlight.ts`). Intended as copy-paste patterns for focus-after-scroll UX.

## Preset wrappers

| Export | Uses |
| ------ | ---- |
| `highlightElementBasic` | Default `applyScrollHighlight` |
| `highlightElementQuick` | `HIGHLIGHT_PRESETS.quick` |
| `highlightElementSuccess` | Green success preset |
| `highlightElementError` | Red, longer, no scaling |
| `highlightElementAttention` | Warning / intense preset |
| `highlightElementCustom` | Duration + color enum |

Additional demos in the same file cover batch highlights, scroll-linked targets, and debug logging (logger disabled by default).

---

**Sources:** `src/lib/utils/scroll-highlight-demo.ts`, `src/lib/utils/scroll-highlight.ts`