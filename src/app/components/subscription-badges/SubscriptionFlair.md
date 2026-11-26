---
title: SubscriptionFlair
description: Corner icon flair for a single subscription on an avatar
---

# SubscriptionFlair

Small positioned badge overlay (not the full text chip).

## Props

| Prop | Default |
|------|---------|
| `subscription` | `SubscriptionBadgeData` |
| `size` | `'sm'` \| `'md'` |
| `position` | `'top-right'` (also top-left, bottom-right, bottom-left) |

## Icons

`getPlanTypeIcon`: tier → crown, addon → wrench, bundle → package. `getStatusIcon`: active, trialing, cancelled, expired, suspended, pending each map to a `SiteIconId`.

---

**Sources:** `src/app/components/subscription-badges/SubscriptionFlair.tsx`