---
title: Subscription page
description: Client tier picker fetching /api/subscription
---

# Subscription page (`/subscription`)

`'use client'` page with `Suspense` boundary for `useSearchParams`.

## Copy

`useSubscriptionCopy()` — `resolveCatalogFromLl(SUBSCRIPTION_EN, ll.subscription)` via `useIdlingLocale`.

## API

`fetch(\`/api/subscription?tier=${tier}\`)` loads `SubscriptionData`: tier features, `paymentUrl`, `currentLimits` (free tier caps).

## UI states

- `SubscriptionLoading` — spinner + localized title
- Error / success views with `InstantLink` CTAs
- Tier selection driven by query `?tier=` (`useSearchParams`)

## Components

`PageContainer`, `PageHeader`, `PageContent`, `FadeIn`, CSS module `subscription.module.css`.

## Auth

Uses `useSession` where tier/checkout requires signed-in user (see full file for gated buttons).

---

**Sources:** `src/app/subscription/page.tsx`