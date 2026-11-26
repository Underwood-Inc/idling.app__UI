---
title: tokenPositioning
description: Map token DOM nodes to logical positions
---

# tokenPositioning

- **`TokenPosition`** — Index range and DOM element link.
- **`getTokenRawText`** — Extract source substring from a token element.
- **`findTokenAtPosition`** — Hit-test logical index → token.
- **`createTokenFromElement`** — Build metadata from DOM.

Foundation for click positioning and cursor snapping at pill edges.

---

**Sources:** `src/lib/rich-input/utils/tokenPositioning.ts`