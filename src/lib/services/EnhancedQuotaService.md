---
title: EnhancedQuotaService
description: Effective user quotas across plans and overrides
---

# EnhancedQuotaService

Static service class (default export). Resolves per-user limits from `user_quota_overrides`, subscription plan features, and service defaults — **higher effective limit wins** when multiple sources apply.

## `getUserQuotaInfo(userId)`

Returns `UserQuotaInfo[]` with `current_usage`, `quota_limit`, `quota_source`, `reset_period`, `reset_date`.

Used by admin quota APIs, OG generation, and `quota.actions` for authenticated checks.

Types: `UserQuotaInfo`, `QuotaOverride`, `ServiceFeature`.

---

**Sources:** `src/lib/services/EnhancedQuotaService.ts`