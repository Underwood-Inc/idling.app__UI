---
title: GlobalGuestQuotaPanel
description: Admin CRUD for anonymous guest quotas per service feature
---

# GlobalGuestQuotaPanel

Default export — manages `global_guest_quotas` style limits for unauthenticated users.

## API

- `noCacheFetch('/api/admin/quotas/global')` — list and create
- Additional routes in source for update/delete and listing `availableFeatures` (service + feature matrix)

## Model

`GlobalGuestQuota`: `service_name`, `feature_name`, `quota_limit`, `is_unlimited`, `reset_period`, `is_active`, display name joins.

`ServiceFeature` rows drive the create/edit picker (current quota, reset period, active flag).

Copy from `useAdminCopy().guestQuotas`.

---

**Sources:** `src/app/admin/components/GlobalGuestQuotaPanel.tsx`