---
title: /api/admin/quotas/global
description: Global guest quota catalog
---

# /api/admin/quotas/global

Co-located with `route.ts`. **Runtime:** `nodejs`, `force-dynamic`.

## GET

Admin/moderator session. Returns `{ quotas, available_features }` — rows from `global_guest_quotas` joined to service/feature display names, plus `getAvailableServiceFeatures()` (limit-type features matching naming heuristics).

## POST

`CreateGlobalQuotaSchema` for `service_name` + `feature_name`. **409** if row exists. `quota_limit` 0 → unlimited. Inserts `global_guest_quotas`, logs `global_quota_create`.

Handlers exported as `GET` / `POST` functions (no `withUniversalEnhancements`).

---

**Sources:** `src/app/api/admin/quotas/global/route.ts`