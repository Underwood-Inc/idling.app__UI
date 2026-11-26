---
title: EditPlanModal
description: Overlay form to update a subscription plan definition
---

# EditPlanModal

Named export — edits plan metadata and pricing.

## Props

| Prop | Role |
|------|------|
| `plan` | existing `Plan` record |
| `onSave(planId, updates)` | async persist |

## Fields

`display_name`, `description`, `plan_type` (`tier` \| `addon` \| `bundle`), monthly/yearly/lifetime cents, `is_active`, `sort_order`.

Uses `useOverlay().closeOverlay` on success. Local loading/error state on submit.

---

**Sources:** `src/app/admin/components/modals/EditPlanModal.tsx`, `src/app/admin/components/modals/EditPlanModal.css`