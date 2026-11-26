---
title: /api/admin/emojis
description: Custom emoji moderation API
---

# /api/admin/emojis

Co-located with `route.ts`. **Runtime:** `nodejs`, `force-dynamic`.

## GET

`PERMISSIONS.ADMIN.EMOJI_APPROVE`. `AdminEmojiSearchParamsSchema` (`page`, `limit`, `status`, `search`). Pending uses `getPendingCustomEmojis`; approved/rejected from SQL on `custom_emojis`. Status `all` merges streams.

## POST

`AdminEmojiActionSchema`: `emojiId`, `action` (`approve` | `reject`), `reason`. Delegates to `approveCustomEmoji` / `rejectCustomEmoji` server actions.

## DELETE

Query `id`, optional `reason` → `deleteCustomEmoji`.

All mutating routes use `withUniversalEnhancements`.

---

**Sources:** `src/app/api/admin/emojis/route.ts`