---
title: AssignRoleModal
description: Assign an admin role to a user with optional expiry
---

# AssignRoleModal

Named export — role assignment dialog.

## Props

| Prop | Role |
|------|------|
| `onAssign(roleId, expiresAt?, reason?)` | async submit |
| `userId` / `userName` | context |
| `currentRoles` | filters out already-assigned roles |

## Data

On open: `GET /api/admin/roles` → filters roles not in `currentRoles`.

Form: role select, optional expiry datetime, optional reason. Submits through parent `onAssign` (panel posts to admin role assignment API).

Also exports `Role` interface and `AssignRoleModalProps`.

---

**Sources:** `src/app/admin/components/modals/AssignRoleModal.tsx`