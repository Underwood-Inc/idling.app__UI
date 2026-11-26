---
title: /api/admin/quotas/global/[id]
description: Update or delete one global guest quota
---

# /api/admin/quotas/global/[id]

Co-located with `[id]/route.ts`. **Runtime:** `nodejs`, `force-dynamic`.

## PUT

`UpdateGlobalQuotaSchema` — dynamic `UPDATE global_guest_quotas` via `sql.unsafe`. Treats `quota_limit: 0` as unlimited. Logs `global_quota_update` with old/new snapshots.

## DELETE

Removes row by id; logs `global_quota_delete` with deleted quota payload.

Admin gate: active `admin` or `moderator` role assignment.

---

**Sources:** `src/app/api/admin/quotas/global/[id]/route.ts`