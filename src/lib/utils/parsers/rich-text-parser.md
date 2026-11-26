---
title: rich-text-parser
description: Composed parser for markdown, emoji, images, hashtags, mentions, URLs
---

# rich-text-parser

`RichTextParser` merges `MarkdownParser`, `EmojiParser`, `ImageParser`, and `ContentParser` segment logic into unified `RichTextToken[]` output.

## Types

- **`RichTextTokenType`** — `text`, `hashtag`, `mention`, `url`, `markdown`, `emoji`, `image`.
- **`RichTextToken`** — Span metadata plus optional `href`, emoji fields, image fields, mention `userId` / `filterType`, URL `behavior`.
- **`RichTextConfig`** — Toggle each feature; optional `imageConfig` (dimensions, `allowedDomains`).

## Class

- **`new RichTextParser(config?)`** — Defaults enable all parsers unless explicitly `false`.
- **`parse(text)`** — Returns ordered tokens with `start` / `end` / `rawText`.
- Module singleton: **`richTextParser`**.

Use when rendering rich submission bodies that need one token stream for highlights and pills.

---

**Sources:** `src/lib/utils/parsers/rich-text-parser.ts`