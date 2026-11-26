---
title: permissions.actions
description: Role assignment and permission checks
---

# permissions.actions

`'use server'`. Central permission helpers for UI and API.

## Exports

| Function | Notes |
| -------- | ----- |
| `assignUserRole(userId, roleName, expiresAt?)` | Requires `PERMISSIONS.ADMIN.ROLES_MANAGE`. **Blocks** `admin` and `moderator` role names (DB-only assignment) |
| `removeUserRole(userId, roleName)` | Same protected-role guard |
| `checkUserPermission(userId, permissionName)` | SQL lookup across roles + direct grants |
| `getCurrentUserPermissions()` | Session-scoped permission list |
| `issueUserTimeout` / `checkCurrentUserTimeout` | User timeout enforcement helpers |

Security violations logged via `createLogger` with `audit: true`.

Used by admin API routes (`checkUserPermission`) and server components.

---

**Sources:** `src/lib/actions/permissions.actions.ts`