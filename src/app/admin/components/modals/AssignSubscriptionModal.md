---
title: AssignSubscriptionModal
description: Assign subscription plan to a user with billing options
---

# AssignSubscriptionModal

Named export — admin assignment wizard for user subscriptions.

## Props

`onAssign(planId, billingCycle, expiresAt?, reason?, priceOverrideCents?, priceOverrideReason?)`, `userId`, `userName`, open/close.

## Flow

Loads active `subscriptionPlans` from admin API on open. Form captures plan, billing cycle, optional end date, assignment reason, optional price override fields.

Submits via parent callback (panel hits admin subscription assignment routes). Styles: `AssignSubscriptionModal.css`.

---

**Sources:** `src/app/admin/components/modals/AssignSubscriptionModal.tsx`, `src/app/admin/components/modals/AssignSubscriptionModal.css`