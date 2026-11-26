---
title: tag-utils
description: Canonical tag normalization for DB, display, and URL query params
---

# tag-utils

Single source of truth for tag shape across storage (no `#`, lowercase), UI (`#` prefix), and URL query strings.

## Functions

| Function | Output |
| -------- | ------ |
| `normalizeTagForDatabase(tag)` | `my_posts` (max 50 chars, `[a-z0-9_-]`) |
| `formatTagForDisplay(tag)` | `#my_posts` |
| `formatTagsForUrl(tags[])` | `my_posts,react` |
| `parseTagsFromUrl(urlTags)` | `['#my_posts', '#react']` |
| `normalizeTagsForDatabase(tags[])` | Batch DB form |
| `isValidTag(tag)` | Whether `normalizeTagForDatabase` is non-empty |

Invalid tags normalize to `''` and are filtered out of arrays.

## When to use

Prefer these helpers over ad hoc `toLowerCase` / strip-hash logic in filters and profile forms. Pair with `tag-regex` when extracting hashtags from prose.

---

**Sources:** `src/lib/utils/string/tag-utils.ts`