---
title: UserProfile
description: Profile card with bio editing and layout variants
---

# UserProfile

Client profile surface. Re-exports `UserProfileData` from `@lib/types/profile`.

## Props

| Prop | Default | Role |
|------|---------|------|
| `user` | required | `UserProfileData` |
| `variant` | `full` | `full` \| `compact` \| `tooltip` |
| `isOwnProfile` | `false` | Enables bio editor |
| `onBioUpdate` | — | Async persist callback |
| `isPending` | `false` | Disables editor actions |

## Behavior

- Display name from `username` \| `name`; join date and location when present.
- Own profile: inline bio edit via `SmartInput` (`ContentWithPills` when read-only), 500-character counter via `getEffectiveCharacterCount`.
- `UserDecorationWrapper` on names; `Avatar` seeded by user id.
- Fetches `/api/test/admin-check` (background header) for admin-only affordances when session exists.

Styles: `UserProfile.css`.

---

**Sources:** `src/app/components/user-profile/UserProfile.tsx`, `@lib/types/profile`