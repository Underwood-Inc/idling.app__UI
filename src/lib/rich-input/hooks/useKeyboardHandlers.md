---
title: useKeyboardHandlers
description: Keyboard events for rich input navigation and pills
---

# useKeyboardHandlers

`useKeyboardHandlers(engine, options)` attaches keydown/keyup logic: arrow navigation with pill snap, word/line boundaries (`navigationUtils`), enter/backspace semantics, and modifier shortcuts.

Expects a live `RichInputEngine` instance from `useRichInput`.

---

**Sources:** `src/lib/rich-input/hooks/useKeyboardHandlers.ts`