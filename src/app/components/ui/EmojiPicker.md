---
title: EmojiPicker
description: Positioned emoji palette with search, categories, and optional pagination
---

# EmojiPicker

Floating picker driven by `useEmojis` hook data.

## Props (`EmojiPickerProps`)

| Prop | Default |
|------|---------|
| `isOpen`, `onClose`, `onEmojiSelect` | required |
| `position` | `{ x, y }` document coordinates |
| `searchQuery` | external filter from `SmartInput` `:` trigger |
| `maxResults` | `24` |
| `enablePagination` | `false` |
| `itemsPerPage` | `24` |
| `autoFetch` | `true` |

## Additional exports

- `EmojiPickerTrigger` — child trigger wrapper.
- `formatEmojiForText`, `useEmojiPicker` — cursor-position helpers used by `SmartInput`.
- Re-exports `EmojiData` type from `useEmojis`.

Escape and click-outside close; category tabs reset pagination.

---

**Sources:** `src/app/components/ui/EmojiPicker.tsx`, `src/app/hooks/useEmojis.ts`