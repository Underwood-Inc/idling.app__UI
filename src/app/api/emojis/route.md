---
title: /api/emojis
description: OS-aware emoji listing and custom emoji upload/usage tracking
---

# /api/emojis

Emoji picker backend: OS-specific built-ins from Postgres via server actions, optional custom emojis, usage tracking.

All handlers use `withUniversalEnhancements`.

## GET

**Query:** `category`, `search`, `page` (default 1), `per_page` (default 50, max 100), `include_custom=true` for custom set.

**OS detection:** `user-agent` → `OSDetection.detectFromUserAgent`; treats OS as `mac` or `windows` for emoji assets.

**Data path:** `getCategoryMapping`, `getEmojiCategories`, `getOSEmojis`, optional `getCustomEmojis`. Response includes `emojis[]`, category summary, `os_info`, `total_count`, pagination fields (`EmojiListResponse`).

## POST

Creates custom emoji: body `name`, `displayName`, `imageData`, optional `category` (defaults category id **9**). Calls `uploadCustomEmoji` — pending approval messaging on success.

## PUT

Usage tracking: body `emojiType`, `emojiId` → `trackEmojiUsage`.

---

**Sources:** `src/app/api/emojis/route.ts`, `@lib/actions/emoji.actions` (upload/track), OpenAPI block at file top