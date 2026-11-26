---
title: EditSubscriptionModal
description: Overlay form to update an assigned user subscription
---

# EditSubscriptionModal

Named export — adjusts lifecycle fields on a `UserSubscription` row.

## Props

`subscription` (status, billing, trial/expiry, assignment reason), `onSave(subscriptionId, updates)`.

## Fields

Status enum (`active`, `cancelled`, `expired`, `suspended`, `pending`, `trialing`), billing cycle, date inputs for `expires_at` / `trial_ends_at`, assignment reason.

`useOverlay().closeOverlay` after successful `onSave`.

---

**Sources:** `src/app/admin/components/modals/EditSubscriptionModal.tsx`, `src/app/admin/components/modals/EditSubscriptionModal.css`