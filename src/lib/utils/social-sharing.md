---
title: social-sharing
description: Strip or flatten embed pills for Open Graph and share text
---

# social-sharing

Prepares submission body text for social previews by handling markdown-style embed pills `![behavior](url)` and `![behavior|width](url)`.

## `cleanContentForSocialSharing(content, options?)`

| Option | Default | Effect |
| ------ | ------- | ------ |
| `convertEmbedsToUrls` | `true` | Replace pills with bare URL |
| `removeEmbeds` | `false` | Drop pills entirely (wins when both set) |
| `maxLength` | `160` | Truncate at word boundary with `...` |

Also collapses whitespace and empty lines.

## URL helpers

- **`extractEmbedUrls(content)`** — Valid URLs from embed pills.
- **`getFirstYouTubeUrl(content)`** — First YouTube / youtu.be link among embed URLs.

---

**Sources:** `src/lib/utils/social-sharing.ts`