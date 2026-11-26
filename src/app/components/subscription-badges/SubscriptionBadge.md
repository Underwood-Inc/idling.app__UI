---
title: SubscriptionBadge
description: Chip showing plan type, status, and billing metadata
---

# SubscriptionBadge

## Types

`SubscriptionBadgeData`: `id`, `name`, `display_name`, `plan_type` (`tier` \| `addon` \| `bundle`), `status`, optional `billing_cycle`, `expires_at`, `trial_ends_at`, `has_price_override`.

## Props

| Prop | Default |
|------|---------|
| `subscription` | required |
| `variant` | `'default'` \| `compact` \| `detailed` |
| `showStatus` / `showBillingCycle` | `true` |

## Presentation

Maps plan type and status to `SiteIcon` ids and theme classes (`subscription-badge--*`). Detailed variant surfaces dates and override flags; compact collapses auxiliary text.

---

**Sources:** `src/app/components/subscription-badges/SubscriptionBadge.tsx`