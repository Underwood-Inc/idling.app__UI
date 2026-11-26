---
title: /api/admin/users/[id]/quota-overrides
description: PUT/DELETE per-user quota overrides
---

# /api/admin/users/[id]/quota-overrides

Admin-only (`admin.users.manage` via role SQL). No `runtime` export; uses `withUniversalEnhancements` on PUT/DELETE.

## PUT

Upserts `user_quota_overrides` for `service_name` + `feature_name`. `UpdateQuotaOverrideSchema`; `quota_limit === 0` → unlimited (`-1` stored). Validates active `subscription_services` / `subscription_features`. Logs `admin_actions` (`user_quota_override`).

Response shape: `{ success, data: { override }, message }`.

## DELETE

Body: `DeleteQuotaOverrideSchema` (service + feature keys). Hard-deletes override row; logs `user_quota_override_remove`.

---

**Sources:** `src/app/api/admin/users/[id]/quota-overrides/route.ts`