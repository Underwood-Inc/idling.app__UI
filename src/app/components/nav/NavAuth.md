---
title: NavAuth
description: Desktop nav session controls
---

# NavAuth

Async server component. Optional `session` prop avoids a second `auth()` call when parent `Nav` already fetched the session.

| State | UI |
|-------|-----|
| Signed out | `NavSignInLink` |
| Signed in | Profile `InstantLink` with `NavUserProfile` + `AuthAvatarServer`, then `SignOut` |

Profile href: `/profile/{user.id}` or `/profile/unknown`.

---

**Sources:** `src/app/components/nav/NavAuth.tsx`, `src/app/components/nav/NavSignInLink.tsx`