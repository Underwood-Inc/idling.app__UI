---
title: Admin dashboard page
description: requireAdmin gate then AdminDashboard inside Suspense
---

# Admin page (`/admin`)

Top-level admin dashboard route.

## Segment config

- `dynamic = 'force-dynamic'`
- `revalidate = 0`
- `metadata` from `buildAdminPageMetadata()`

## Authorization

**Additional** check beyond layout: `await requireAdmin()` — if false, `redirect('/')` (home, not sign-in).

Layout already enforces `PERMISSIONS.ADMIN.ACCESS`; this page uses the stricter admin helper (see `@lib/permissions/permissions`).

## Render

```text
.admin-page
  Suspense → Loader
    AdminDashboard
```

`AdminDashboard` is the heavy client/server mix for panels (users, analytics, etc.).

## vs layout

Layout blocks unauthenticated users; page blocks non-admin roles that might still have a session.

---

**Sources:** `src/app/admin/page.tsx`