---
title: useEmojis
description: Client hook for paginated /api/emojis with module-level dedupe cache
---

# useEmojis

Client hook (and helpers) for the emoji catalog API with OS-aware defaults.

## Public exports

- **Types:** `EmojiData`, `EmojiCategory`, `EmojiFilters`, `EmojiResponse`, `UseEmojisOptions`, `UseEmojisReturn`
- **`useEmojis(options?)`** — main data hook
- **`useEmojiPicker()`** — opinionated wrapper for picker UI
- **`getEmojiDisplay(emoji)`** — custom image URL or unicode char/name
- **`formatEmojiForText(emoji)`** — `:emoji_id:` colon syntax for `RichTextParser`

## `useEmojis` options

| Option | Default | Behavior |
|--------|---------|----------|
| `autoFetch` | `true` | Fetches on mount when `useOSDetection().isSupported` |
| `defaultFilters` | `{}` | Merged; defaults `includeCustom` / `includeUsage` true |
| `pageSize` | `50` | `per_page` query param |

## Return shape

State: `emojis`, `categories`, `osInfo` (from API), `loading`, `error`, `hasMore`, `currentPage`, `totalCount`, `filters`.

Actions: `fetchEmojis`, `loadMore`, `setFilters`, `searchEmojis`, `selectCategory`, `refreshEmojis`, `trackEmojiUsage`.

## HTTP

- **GET** `/api/emojis?page&per_page&category&search&include_custom&include_usage` via `noCacheFetch`
- Non-OK: parses JSON `error`, sets hook `error`
- **POST** `/api/emojis/usage` with `{ emoji_id, emoji_type }` — failures logged only

## Module cache (non-obvious)

Module singleton `globalEmojiCache` (5 min TTL) dedupes **page 1, unfiltered** requests: shares in-flight `promise` and cached `data`. `refreshEmojis` clears cache. Filtered/search requests bypass cache.

## `useEmojiPicker`

Tracks `selectedCategory` / `searchQuery` locally; `handleEmojiSelect` picks `windows` | `mac` | `custom` for usage tracking and returns display string.

---

**Sources:** `src/app/hooks/useEmojis.ts`