---
title: emoji.actions
description: Server actions for OS and custom emoji
---

# emoji.actions

`'use server'` module. Uses `auth`, `sql`, `EmojiEncryptionService`, admin checks via `checkUserPermission` / `PERMISSIONS`.

## Read paths

| Export | Behavior |
| ------ | -------- |
| `getOSEmojis(userOS, category?, search?, limit?, offset?)` | Session required. Queries `emojis_windows` or `emojis_mac` with optional filters; joins `emoji_usage` per user |
| `getCustomEmojis(search?, limit?, offset?)` | Approved custom emojis only |
| `getPendingCustomEmojis(limit, offset)` | Admin moderation queue |
| `getEmojiCategories` / `getCategoryMapping` | Category catalog helpers |

## Mutations

| Export | Behavior |
| ------ | -------- |
| `uploadCustomEmoji` | Creates pending custom emoji (encrypted image payload) |
| `approveCustomEmoji` / `rejectCustomEmoji` / `deleteCustomEmoji` | Admin moderation; `revalidatePath` where applicable |
| `trackEmojiUsage` | Increments usage counters |

Throws on missing session; admin paths gate on emoji approve/manage permissions.

---

**Sources:** `src/lib/actions/emoji.actions.ts`