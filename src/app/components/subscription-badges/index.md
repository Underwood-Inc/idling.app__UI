---
title: subscription-badges index
description: Barrel exports for subscription flair and badge UI
---

# subscription-badges (barrel)

Public API for monetization/status visuals on avatars, usernames, and profile panels.

## Exports

| Component | Types |
|-----------|-------|
| `AvatarWithFlairs` | `AvatarWithFlairsProps` |
| `SubscriptionBadge` | `SubscriptionBadgeData`, `SubscriptionBadgeProps` |
| `SubscriptionBadgesList` | `SubscriptionBadgesListProps` |
| `SubscriptionFlair` | `SubscriptionFlairProps` |
| `SubscriptionFlairToggle` | `SubscriptionFlairToggleProps` |
| `UsernameDecoration` | `UsernameDecorationProps` |

Data shape `SubscriptionBadgeData` is shared across flairs, lists, and badges (plan type, status, billing cycle, trial/expiry fields).

---

**Sources:** `src/app/components/subscription-badges/index.ts`