---
title: SubscriptionManagementPanel
description: Admin plans and user subscriptions with overlay modals
---

# SubscriptionManagementPanel

Default export — dual view: subscription **plans** catalog and **user subscriptions** assignments.

## API highlights

- `noCacheFetch('/api/admin/subscription-plans')`
- `noCacheFetch('/api/admin/user-subscriptions')`
- `noCacheFetch('/api/admin/subscription-stats')`
- Plan CRUD: `fetch` to `/api/admin/subscription-plans/{id}`

## Modals

| Modal | Role |
|-------|------|
| `AssignSubscriptionModal` | attach plan to user |
| `EditPlanModal` | plan pricing/metadata (`useOverlay`) |
| `EditSubscriptionModal` | subscription status, billing, expiry |

Uses `useOverlay` for overlay-hosted edits. Copy from `useAdminCopy()`.

---

**Sources:** `src/app/admin/components/SubscriptionManagementPanel.tsx`, `src/app/admin/components/SubscriptionManagementPanel.css`, `src/app/admin/components/modals/AssignSubscriptionModal.tsx`, `src/app/admin/components/modals/EditPlanModal.tsx`, `src/app/admin/components/modals/EditSubscriptionModal.tsx`