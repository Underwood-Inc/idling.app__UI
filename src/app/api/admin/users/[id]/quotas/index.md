---
title: /api/admin/users/[id]/quotas
description: Read and patch user quota state
---

# /api/admin/users/[id]/quotas

Co-located with `route.ts` in this folder.

## GET

Session + admin/moderator role check. Loads quotas via `EnhancedQuotaService.getUserQuotaInfo`, enriches display names from `subscription_services` / `subscription_features`. Returns `{ success, data: { quotas: UserQuotaData[] } }`.

`UserQuotaData` exposes usage, limits, `quota_source`, `is_custom`, reset metadata.

## PATCH

Exported as bare `PATCH` (not wrapped in export const). Same override upsert logic as quota-overrides; optional `reset_usage` deletes matching `subscription_usage` rows. Default `reset_period` when creating: `monthly`.

---

**Sources:** `src/app/api/admin/users/[id]/quotas/route.ts`