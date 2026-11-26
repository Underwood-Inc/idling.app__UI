---
title: emoji-parser
description: "Custom :code: emoji resolution with API-backed registry"
---

# emoji-parser

Resolves `:alias:` tokens to Unicode or image URLs using a cached `EmojiRegistry` and `noCacheFetch` for API loads.

## Types

- **`EmojiDefinition`** — id, name, unicode/imageUrl, category, tags, aliases.
- **`EmojiToken`** — Span in source text with resolved display value.

## Classes

- **`EmojiRegistry`** — Singleton cache and lookup by alias/name.
- **`EmojiParser`** — `parse(text)` / tokenization for rich text pipelines.

## Singletons

- `emojiParser` — default parser instance.
- `emojiRegistry` — shared registry.

Fails softly when an emoji is missing (fallback behavior in implementation).

---

**Sources:** `src/lib/utils/parsers/emoji-parser.ts`