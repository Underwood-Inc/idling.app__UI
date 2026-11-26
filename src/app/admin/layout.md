---
title: Admin layout
description: Server-side gate for all /admin routes via session + ADMIN.ACCESS
---

# Admin layout

Parent layout for every route under `/admin/**`.

## Exports

- `dynamic = 'force-dynamic'` — no static admin shells
- default `AdminLayout({ children })`

## Authorization (order matters)

1. `const session = await auth()`
2. No `session.user.id` → `redirect('/api/auth/signin?callbackUrl=/admin')`
3. `requirePermission(PERMISSIONS.ADMIN.ACCESS)` false → `redirect('/api/auth/signin?error=insufficient_permissions')`

Uses `@lib/permissions/permissions` — same system as API admin routes.

## Markup

`.admin-layout` > `.admin-content` wrapping `children`. No nav chrome here (dashboard components supply UI).

## Edge cases

Sign-in URL uses **API** auth route with query errors, not `/auth/signin` page — intentional for NextAuth handler.

---

**Sources:** `src/app/admin/layout.tsx`