---
title: UserSubscriptionManagementModal
description: Per-user subscription admin with quick actions
---

# UserSubscriptionManagementModal

Large client modal for managing one user's subscriptions from the user table.

## Capabilities

- Lists current subscriptions with plan metadata and status
- Quick actions (extend, cancel, suspend, etc.) via `QuickActionConfig` + confirm text
- Plan change / assign flows tied to admin subscription APIs (`fetch` handlers in source)
- Uses `LoadingButton` for async safety

Opened from `UserManagementPanel` `onManageSubscription`. Styles: `UserSubscriptionManagementModal.css`.

---

**Sources:** `src/app/admin/components/modals/UserSubscriptionManagementModal.tsx`, `src/app/admin/components/modals/UserSubscriptionManagementModal.css`