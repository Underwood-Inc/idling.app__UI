---
title: SubscriptionFlairToggle
description: User settings control to pick active username decoration flair
---

# SubscriptionFlairToggle

Settings panel listing eligible flairs derived from the user’s subscriptions.

## Props

| Prop | Role |
|------|------|
| `userId` | required |
| `className` | wrapper |

## Mapping

`getFlairForSubscription` maps names/plan types to flair keys (`enterprise-crown`, `premium-galaxy`, `pro-plasma`, `active-glow`, `trial-pulse`, etc.). `getFlairDisplay` supplies `SiteIcon` + label.

Reads/writes flair preference through `useFlairPreference` and subscription fetch (see source for save API). Used on profile/preferences surfaces.

---

**Sources:** `src/app/components/subscription-badges/SubscriptionFlairToggle.tsx`, `@lib/actions/subscription.actions`