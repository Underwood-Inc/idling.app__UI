---
title: markdown-parser
description: Lightweight inline markdown tokenizer
---

# markdown-parser

Static `MarkdownParser.parse(text)` with no external markdown dependencies.

## Token types

`text`, `bold`, `italic`, `code`, `link`, `strikethrough`, `underline`, `blockquote`, `list-item`.

## Precedence

Processes code spans first, then bold/italic/strike, links, blockquote and list line patterns — tracked ranges avoid overlapping tokens.

## `MarkdownToken`

Each token includes `content`, optional `href`, and `start` / `end` indices in the source string.

Consumed by `RichTextParser` when `enableMarkdown` is on.

---

**Sources:** `src/lib/utils/parsers/markdown-parser.ts`