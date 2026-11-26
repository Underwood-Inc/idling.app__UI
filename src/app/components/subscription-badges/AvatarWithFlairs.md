---
title: AvatarWithFlairs
description: Avatar with up to four subscription flairs from user API
---

# AvatarWithFlairs

Wraps `Avatar` and fetches `/api/user-subscriptions?userId=` when `showFlairs` and `userId` are set (background request header skips global loader).

## Props

| Prop | Default |
|------|---------|
| `seed`, `size` | Passed to `Avatar` |
| `userId` | Required for fetch |
| `maxFlairs` | `3` (placed on four corners cyclically) |
| `flairSize` | `'sm'` |
| `enableTooltip` / `tooltipScale` | Optional enlarged avatar tooltip |

Assigns each subscription a corner from `positions` array rotation.

---

**Sources:** `src/app/components/subscription-badges/AvatarWithFlairs.tsx`, `src/app/components/avatar/Avatar.tsx`