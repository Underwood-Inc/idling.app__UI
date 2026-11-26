---
title: quota.actions
description: Guest and user quota server actions
---

# quota.actions

`'use server'`. Wraps `EnhancedQuotaService` and direct SQL for guests.

## Types

`QuotaCheck` (`allowed`, limits, `quota_source`, `reset_date`, …), `UsageRecord`, `GuestIdentity` (`client_ip`, optional fingerprint hashes).

## Exports

| Function | Role |
| -------- | ---- |
| `checkGuestQuota(identity, serviceName, featureName)` | Reads `global_guest_quotas`, aggregates `guest_usage_tracking` |
| `recordGuestUsage(...)` | Upserts guest usage with conflict increment |
| `checkUserQuota(userId, serviceName, featureName)` | Authenticated quota via enhanced service |
| `recordUserUsage(...)` | Records authenticated usage |

`quota_source` enum: `user_override`, `subscription_plan`, `global_guest`, `system_default`.

Consumed by OG image service and feature gateways.

---

**Sources:** `src/lib/actions/quota.actions.ts`