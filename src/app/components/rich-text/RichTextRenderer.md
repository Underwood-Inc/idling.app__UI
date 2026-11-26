---
title: RichTextRenderer
description: Parsed idling rich text with emoji and media hooks
---

# RichTextRenderer

Client renderer for idling markup via `richTextParser` and `emojiRegistry`.

## Props

| Prop | Role |
|------|------|
| `content` | Source string |
| `config` | Partial `RichTextConfig` overrides |
| `onEmojiClick` / `onImageClick` / `onLinkClick` | Interaction callbacks |
| `maxLength` | Truncate with ellipsis |
| `showEmojiTooltips` | Default `true` |

Memoizes parse output; supports truncation before parse. Styles: `RichText.css`.

---

**Sources:** `src/app/components/rich-text/RichTextRenderer.tsx`, `@lib/utils/parsers/rich-text-parser`