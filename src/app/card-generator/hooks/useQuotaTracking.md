---
title: useQuotaTracking
description: Session-aware OG generation quota from dry-run API
---

# useQuotaTracking

Returns `QuotaState` plus `updateQuota`, `initializeQuota`, `clearQuota`, optional `quotaError`.

## Initialization

`initializeQuota` → `GET /api/og-image?format=json&dry-run=true` with aggressive cache-busting headers. Works for signed-in users and guests (backend global guest quotas).

## Session hygiene

Watches `useSession()`; clears quota cache and localStorage keys when user id changes. `isQuotaExceeded` only true after `hasInitializedQuota`.

---

**Sources:** `src/app/card-generator/hooks/useQuotaTracking.ts`, `src/app/card-generator/types/generation.ts`