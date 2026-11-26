---
title: permissions
description: RBAC service and permission constants
---

# permissions

Server-oriented RBAC utilities (`PermissionsService` class) plus canonical string constants.

## `PERMISSIONS`

Nested groups, e.g. `ADMIN.USERS_VIEW`, `ADMIN.PERMISSIONS_MANAGE`, `EMOJI.CREATE_CUSTOM` — used across API routes and server actions.

## `TIMEOUT_TYPES`

`emoji_submission`, `rate_limit`, `general`, `full_access`.

## `PermissionsService`

Methods for loading user permissions/roles, timeout checks, and caching (`unstable_noStore` on hot paths). Types: `Permission`, `UserRole`, `UserTimeout`, `TimeoutCheck`.

Pair with `checkUserPermission` in `permissions.actions` for action-layer checks.

---

**Sources:** `src/lib/permissions/permissions.ts`