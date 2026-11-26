---
title: tag-regex
description: Regex and helpers for parsing and validating hashtags in user text
---

# tag-regex

Hashtag detection and validation for titles, descriptions, and tag input fields. Works with `tag-utils` for database-normalized tags elsewhere in the app.

## Exports

| Export | Role |
| ------ | ---- |
| `tagRegex` | Global regex `/#([^\s#]\w+)/gim` for inline hashtag matches |
| `isValidTag(tag)` | `#` prefix plus alphanumeric, `_`, `-` only |
| `normalizeTag(tag)` | Lowercase tag with `#` prefix, or empty if invalid |
| `extractTagsFromText(text)` | All normalized tags from free text via `tagRegex` |
| `parseTagsInput(tagsString)` | Comma-separated or space-separated `#tag` lists |
| `validateTagsInput(tagsString)` | User-facing error strings for bad tag input |

## Parsing rules

- `parseTagsInput` prefers commas; if a single token contains spaces and every part starts with `#`, it splits on whitespace.
- `validateTagsInput` mirrors parse logic and reports missing `#` or invalid characters per tag.

## Example

```typescript
import { extractTagsFromText, validateTagsInput } from '@/lib/utils/string/tag-regex';

extractTagsFromText('Ship it #epic win'); // ['#epic']
validateTagsInput('badtag, #ok'); // ['Tag "badtag" must start with # ...']
```

---

**Sources:** `src/lib/utils/string/tag-regex.ts`