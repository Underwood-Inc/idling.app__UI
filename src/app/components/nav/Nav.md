---
title: Nav
description: Async site header composing navbar primitives and auth
---

# Nav

Default export: server component wrapping the global navigation bar.

## Flow

1. `unstable_noStore()` + `auth()` for fresh session on each request.
2. `Navbar` layout: `MobileNav` (small screens), desktop `NavPaths`, centered brand `InstantLink` → `NavBrandTitle`, optional `LocalizedUserSearch` when signed in, `NavAuth`.

Test ids from `NAV_SELECTORS`; styles in `Nav.css`.

---

**Sources:** `src/app/components/nav/Nav.tsx`, `src/app/components/navbar/Navbar.tsx`