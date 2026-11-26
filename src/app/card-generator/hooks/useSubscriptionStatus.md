---
title: useSubscriptionStatus
description: Pro plan detection for advanced generator controls
---

# useSubscriptionStatus

Fetches subscription summary for gating Pro UI.

## Types

`SubscriptionStatus`: `hasActiveSubscription`, `isPro`, optional `currentPlan`, `subscription` (status, billing, price override flags).

## API

`noCacheFetch('/api/subscription/status?_t=...')` with `X-Background-Request: true` to skip global loader.

Refetches when session becomes authenticated; exposes `isLoading`, `error`, `refetch`.

---

**Sources:** `src/app/card-generator/hooks/useSubscriptionStatus.ts`