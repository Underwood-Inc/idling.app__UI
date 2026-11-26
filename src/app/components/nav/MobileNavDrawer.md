---
title: MobileNavDrawer
description: Full-screen mobile navigation portal
---

# MobileNavDrawer

Props: `isOpen`, `onClose`. When open, portals `mobile-nav-drawer` overlay to `document.body`.

`MobileNavContent` includes brand home link, close control, optional `LocalizedUserSearch` for sessions, grouped routes mirroring desktop (`NAV_GROUPS`, external link icons), and `MobileNavAuth`. Link clicks call `onClose`. Focus trap and escape handling managed in the full component.

---

**Sources:** `src/app/components/nav/MobileNavDrawer.tsx`, `@lib/routes`