---
title: InlineSuggestionInput
description: Input or textarea with hashtag and mention suggestion dropdowns
---

# InlineSuggestionInput

Portal-mounted suggestion panel triggered by `#` or `@` before the caret.

## Props (`InlineSuggestionInputProps`)

| Prop | Default | Notes |
|------|---------|-------|
| `value` / `onChange` | required | Controlled |
| `onHashtagSearch` / `onUserSearch` | — | Paginated `SuggestionItem[]` providers |
| `as` | `'input'` | `'textarea'` + `rows` |
| `maxSuggestions` | `10` | |
| `minQueryLength` | `2` | Before fetch |
| `onPaste` | — | Used by `SmartInput` for images |

## `SuggestionItem`

`id`, `value`, `label`, optional `displayName`, `avatar`, `type: 'hashtag' \| 'user'`, `disabled`.

## UX

Keyboard navigation in list; positions dropdown from caret geometry; click-outside and Escape dismiss. Implementation lives in a large single module—see source for pagination (“load more”) and trigger index bookkeeping.

---

**Sources:** `src/app/components/ui/InlineSuggestionInput.tsx`