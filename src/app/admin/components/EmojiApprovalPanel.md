---
title: EmojiApprovalPanel
description: Paginated admin queue for custom emoji approval
---

# EmojiApprovalPanel

Default export — moderates user-submitted custom emojis.

## API

- `GET /api/admin/emojis` with query `status`, `page`, `limit` (20), `search`
- Approve/reject/batch actions call admin emoji endpoints in component handlers (see source after line 78)

## UI state

| State | Purpose |
|-------|---------|
| `statusFilter` | `all` \| `pending` \| `approved` \| `rejected` (default `pending`) |
| `selectedEmojis` | bulk selection set |
| `showRejectModal` | reject flow with `rejectReason` |

Copy via `useAdminCopy().emojis`. Renders preview from `image_data` / encrypted payload fields on `CustomEmoji` rows.

---

**Sources:** `src/app/admin/components/EmojiApprovalPanel.tsx`, `src/app/admin/components/EmojiApprovalPanel.css`