---
title: NavbarBrand
description: Navbar avatar by session state
---

# NavbarBrand

Client brand avatar (distinct from text `NavBrandTitle`):

- **loading:** pulsing placeholder circle
- **signed out:** default user `SiteIcon` in branded circle
- **signed in:** `AuthAvatar` size `sm`

---

**Sources:** `src/app/components/navbar/NavbarBrand.tsx`, `src/app/components/auth-avatar/AuthAvatar.tsx`