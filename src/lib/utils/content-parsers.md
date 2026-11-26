---
title: content-parsers
description: Composable hashtag, mention, and URL pill parsers with tokenization
---

# content-parsers

Modular parsers that turn raw submission text into `ContentSegment` lists and multi-level `TokenizedContent` (characters, words, pills).

## Core types

- **`ContentSegment`** — `text` | `hashtag` | `mention` | `url` with optional `userId`, `behavior`, `rawFormat`, spans.
- **`TokenizedContent`** — Character/word/pill indices linked to `segments`.
- **`ParsedMatch`** — Unified match record for composition.

## Parser classes

| Class | Pattern |
| ----- | ------- |
| `HashtagParser` | `#tag` |
| `MentionParser` | `@user`, enhanced `@[name\|id]` forms |
| `URLParser` / URL pill integration | Uses `url-pills` config |
| `ContentParser` | Orchestrates parsers and tokenization |

Exports additional regex-based helpers for detecting URLs in text (`detectURLsInText`, `parseURLPill` from config).

Use for rich input, search filters, and render pipelines that need stable segment boundaries.

---

**Sources:** `src/lib/utils/content-parsers.ts`, `src/lib/config/url-pills.ts`