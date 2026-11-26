---
title: /api/admin/permissions/roles
description: Admin roles list and create
---

# /api/admin/permissions/roles

**Runtime:** `nodejs`. Lives under permissions tree but manages `user_roles`.

## GET

`PERMISSIONS.ADMIN.ROLES_VIEW`. `RoleSearchSchema` query (`search`, `status`, `sort_by`, `sort_order`, `page`, `limit`). Each role includes nested active `permissions` from `role_permissions`.

## POST

`PERMISSIONS.ADMIN.ROLES_MANAGE`. `RoleCreateSchema`: `name`, `display_name`, optional styling (`role_color`, `role_icon`), `is_default`, `permissions` (numeric IDs), `metadata`, `reason`.

Clears other defaults when `is_default`. Inserts `role_permissions` rows, `roles_audit` (`create`). **409** on duplicate name.

---

**Sources:** `src/app/api/admin/permissions/roles/route.ts`