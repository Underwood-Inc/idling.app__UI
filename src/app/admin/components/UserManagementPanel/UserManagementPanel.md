---
title: UserManagementPanel
description: Orchestrator for admin user table, search, filters, and modals
---

# UserManagementPanel

Named export — main admin user-management shell.

## Props

| Prop | Role |
|------|------|
| `onUserUpdate` | optional parent refresh after mutations |

## Composition

Wires hooks (`useUsersData`, `useSmartSearch`, `useColumnFiltering`, `useColumnSorting`, `useInfiniteScroll`, `usePaginatedUsers`) into:

- `HeaderSection` — search + export + filter toggle
- `FilterPanel` — column filters
- `UserTable` — sortable rows + action menus
- `PaginationSection` — traditional vs infinite (`usePaginationMode`)
- `QuotaManagement` — per-user quota overlay

## Modals

`AssignRoleModal`, `ExportModal`, `TimeoutModal`, `UserDetailsModal`, `UserSubscriptionManagementModal` — opened from row actions.

Filtered/sorted list: `applyColumnFilters` then custom sorts from `SORTABLE_COLUMNS`.

Copy: `useAdminCopy().userManagement`.

---

**Sources:** `src/app/admin/components/UserManagementPanel/UserManagementPanel.tsx`, `src/app/admin/components/UserManagementPanel.css`