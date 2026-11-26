---
title: /api/admin/users/[id]/assign-subscription
description: Assign, update, cancel user subscriptions
---

# /api/admin/users/[id]/assign-subscription

Co-located with `route.ts`. `requireAdminApiAccess(PERMISSIONS.ADMIN.USERS_MANAGE)` on all methods.

## POST

`AdminSubscriptionAssignmentSchema`: `planId`, optional `billingCycle`, `expiresAt`, `status`, `reason`, price override fields. Rejects if user already has active/trialing subscription (**409**). Derives `expiresAt` from cycle when omitted (`lifetime` → null).

Inserts `user_subscriptions` with `assigned_by` = admin.

## PATCH

`AdminSubscriptionUpdateSchema`: `subscriptionId`, `status`, `expiresAt`, `reason` — updates row scoped to target user.

## DELETE

Query: `AdminSubscriptionCancelParamsSchema` (`subscriptionId`, `reason`). Sets `status = 'cancelled'`.

---

**Sources:** `src/app/api/admin/users/[id]/assign-subscription/route.ts`