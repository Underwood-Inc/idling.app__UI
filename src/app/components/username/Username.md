---
title: Username
description: Inline display name with optional profile link and flairs
---

# Username

Lightweight username chip (no avatar/tooltip stack).

## Props

`userId`, `displayName`, optional `linkToProfile`, `className`, `size` (`sm` \| `md` \| `lg`), `weight`, `showDecoration`, `forceDecoration`, `onClick`, `data-testid`.

Wraps text in `UserDecorationWrapper` when `userId` is set. Profile links use `InstantLink` to `/profile/{userId}`. Styles: `Username.css`.

---

**Sources:** `src/app/components/username/Username.tsx`, `src/app/components/decoration/UserDecorationWrapper.tsx`