---
title: SubscriptionBadgesList
description: Fetches and lists a user’s subscriptions with admin mock fallback
---

# SubscriptionBadgesList

## Props

| Prop | Default |
|------|---------|
| `userId` | required |
| `variant` | `'default'` \| `compact` \| `detailed` |
| `maxDisplay` | caps visible chips |
| `title`, `emptyMessage` | optional chrome |
| `className` | wrapper |

## Data

Loads `/api/user-subscriptions` for the user. Session role checks allow admins to view mock catalog entries (`mockSubscriptions` in source) for visual QA when API returns empty.

Renders `SubscriptionBadge` rows; overflow may collapse to “+N more” depending on variant (see component).

---

**Sources:** `src/app/components/subscription-badges/SubscriptionBadgesList.tsx`