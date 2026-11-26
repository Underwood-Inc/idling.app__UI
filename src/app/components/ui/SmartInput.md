---
title: SmartInput
description: Composes mentions, emojis, URL pills, and image paste on InlineSuggestionInput
---

# SmartInput

`forwardRef` wrapper around `InlineSuggestionInput` plus optional `EmojiPicker`.

## Feature flags

| Prop | Default | Effect |
|------|---------|--------|
| `enableUserMentions` | `true` | `searchUsers` server action for `@` suggestions |
| `enableHashtags` | `false` | Hashtag search stub (empty results today) |
| `enableEmojis` | `true` | `:` trigger opens positioned `EmojiPicker` |
| `enableImagePaste` | `true` | Clipboard images → `data:temp-image` pill insert |
| `existingUserIds` / `existingHashtags` | `[]` | Marks suggestions disabled |

## URL auto-pill

On trailing space after a bare `https?://` token, dynamic import of `@lib/config/url-pills` may replace the URL with a structured pill when domain config matches.

## Re-exports

`InlineSuggestionInput`, `InlineSuggestionInputProps`, `SuggestionItem` for callers that do not need the full stack.

---

**Sources:** `src/app/components/ui/SmartInput.tsx`, `src/app/components/ui/InlineSuggestionInput.tsx`, `src/app/components/ui/EmojiPicker.tsx`, `@lib/actions/user-search.actions`