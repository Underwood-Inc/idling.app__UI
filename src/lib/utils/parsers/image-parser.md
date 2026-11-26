---
title: image-parser
description: Secure markdown/HTML image embed tokenization
---

# image-parser

Parses image syntax into `ImageToken` records with domain and extension allowlists.

## Config (`ImageConfig`)

`maxWidth`, `maxHeight`, `allowedDomains`, `allowedExtensions`, `lazyLoading`, `placeholder` — sensible CDN defaults when omitted.

## `ImageParser`

- Detects markdown `![alt](src)`, HTML `<img>`, and custom embed forms.
- Rejects or strips URLs outside allowed domains/extensions.
- Exposes span metadata: `format`, `rawText`, dimensions when present.

## Export

`imageParser` — default instance used by `RichTextParser`.

---

**Sources:** `src/lib/utils/parsers/image-parser.ts`