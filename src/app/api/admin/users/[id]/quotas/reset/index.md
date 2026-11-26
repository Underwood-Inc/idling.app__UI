---
title: POST /api/admin/users/[id]/quotas/reset
description: Zero out usage counters for one feature
---

# POST /api/admin/users/[id]/quotas/reset

Sibling: `reset/route.ts`.

## Auth

`requireAdminApiAccess(PERMISSIONS.ADMIN.USERS_MANAGE)`.

## Body

`ResetUserQuotaSchema`: `service_name`, `feature_name`, optional `reason`.

## Behavior

Reads today's `subscription_usage` sum, deletes today's usage rows for that service/feature, and clears matching `guest_usage` by user email. Logs `admin_actions` (`user_quota_reset`).

Returns `{ success, data: { reset: true, previous_usage }, message }`.

---

**Sources:** `src/app/api/admin/users/[id]/quotas/reset/route.ts`