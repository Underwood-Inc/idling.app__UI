---
title: UserTable
description: Sortable admin user grid with row actions
---

# UserTable

Named export — renders the user list using `SORTABLE_COLUMNS` headers and row cells from `components.tsx`.

## Props

Passes through sort handlers (`onSort`, `getSortIndicator`), infinite-scroll refs/flags, and row actions: view, assign role, manage subscription/quota, export, timeout, revoke.

## Cells

- `UserInfoCell`, `RolesCell`, `TimeoutDetailsCell`
- `UserActionsMenu` inside `InteractiveTooltip`
- `formatDate`, `getPlansDisplay`, `getStatusBadge` from `utils`

`tableContainerRef` attaches scroll listener for infinite mode (wired in parent).

---

**Sources:** `src/app/admin/components/UserManagementPanel/UserTable.tsx`