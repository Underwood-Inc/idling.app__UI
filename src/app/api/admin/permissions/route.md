---
title: /api/admin/permissions
description: Admin permission catalog — list, create
---

# /api/admin/permissions

**Runtime:** `nodejs`. Handlers wrapped with `withUniversalEnhancements`.

## GET

Requires session + `PERMISSIONS.ADMIN.PERMISSIONS_VIEW`. Query parsed with `PermissionSearchSchema` (`search`, `category`, `status`, `risk_level`, `sort_by`, `sort_order`, `page`, `limit`).

Returns `{ permissions, overview, pagination }`. Permissions include role/user usage counts from SQL joins on `permissions`, `role_permissions`, `user_permissions`.

## POST

Requires `PERMISSIONS.ADMIN.PERMISSIONS_MANAGE`. Body: `PermissionCreateSchema` (`name`, `display_name`, `category`, optional `description`, `risk_level`, `dependencies`, `metadata`, `reason`).

Inserts into `permissions`, writes `permissions_audit` row. **409** if name exists.

## Exported types

`PermissionOverview`, `PermissionWithStats`, `RoleWithStats` (also used by related admin UIs).

---

**Sources:** `src/app/api/admin/permissions/route.ts`