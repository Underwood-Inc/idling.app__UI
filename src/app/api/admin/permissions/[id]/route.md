---
title: /api/admin/permissions/[id]
description: Single permission CRUD and archive
---

# /api/admin/permissions/[id]

**Runtime:** `nodejs`. Route param `id` validated via `PermissionIdSchema` (`IdRouteContext`).

## GET

`PERMISSIONS.ADMIN.PERMISSIONS_VIEW`. Returns `{ permission, roles, users, audit_history }` — detail row plus role assignments, direct grants (limit 20), audit (limit 10).

## PATCH

`PERMISSIONS.ADMIN.PERMISSIONS_MANAGE`. Body: `PermissionUpdateSchema`. System permissions cannot be disabled (`is_active: false`). Updates `permissions`, logs `permissions_audit` (`update`).

## DELETE

Soft-archive: body requires `reason` (`PermissionArchiveSchema`). Forbidden for `is_system`. Sets archived flags, revokes active `role_permissions` / `user_permissions`, audit `archive`.

---

**Sources:** `src/app/api/admin/permissions/[id]/route.ts`