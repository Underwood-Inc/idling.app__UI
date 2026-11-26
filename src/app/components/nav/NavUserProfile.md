---
title: NavUserProfile
description: Display name with decorations in the nav chrome
---

# NavUserProfile

Client component showing the signed-in user’s display name in `header__user-name`.

Uses `useSession` with optional `initialSession` from SSR to limit hydration flicker. Wraps the name in `UserDecorationWrapper` for subscription flairs. Loading and unauthenticated states return placeholder or `null`.

---

**Sources:** `src/app/components/nav/NavUserProfile.tsx`, `src/app/components/decoration/UserDecorationWrapper.tsx`