---
title: useRichInput
description: React hook wiring RichInputEngine to contenteditable
---

# useRichInput

`useRichInput(ref, options?)` returns caret control, value sync, and event bindings for the rich editor.

## Types

- **`UseRichInputOptions`** — extends `RichInputConfig` with engine options.
- **`UseRichInputReturn`** — handlers, `state`, imperative helpers (see source).

Delegates keyboard/mouse behavior to `useKeyboardHandlers` and `useMouseHandlers`.

---

**Sources:** `src/lib/rich-input/hooks/useRichInput.ts`