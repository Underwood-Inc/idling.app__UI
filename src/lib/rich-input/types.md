---
title: rich-input types
description: Shared types for rich content input engine and hooks
---

# rich-input types

Contracts for the custom rich text editor (pills, mentions, URLs, emojis).

## Core shapes

- **`RichInputPosition` / `RichInputSelection` / `RichInputRange`** — Index-based caret and selection.
- **`RichContentToken` / `RichContentTokenType`** — Renderable token with type-specific payload.
- **`RichInputState`** — Document value, selection, history pointers.
- **`RichInputConfig`** — Feature flags, parsers, maxlength, placeholders.
- **`RichInputAPI` / `RichContentParser` / `RichInputEventHandlers`** — Engine surface for hooks.

Consumed by `RichInputEngine`, `useRichInput`, and coordinate utilities under `rich-input/utils/`.

---

**Sources:** `src/lib/rich-input/types.ts`