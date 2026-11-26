---
title: RichInputEngine
description: Imperative API for contenteditable rich input
---

# RichInputEngine

`class RichInputEngine implements RichInputAPI` — orchestrates token render tree, selection, history, and parser integration for the rich submission editor.

Mounts against a contenteditable root, syncs `RichInputState`, and exposes methods used by `useRichInput` (insert, delete, undo, pill navigation).

Pair with `WidthMeasurement` for pixel-accurate caret mapping.

---

**Sources:** `src/lib/rich-input/core/RichInputEngine.ts`