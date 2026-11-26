---
title: UserManagementPanel types
description: Shared TypeScript contracts for admin user management
---

# User management types

Central interfaces for the modular user panel.

## Core entities

- `ManagementUser` — id, profile, provider, timeout summary, role summary, nested `roles` / `subscriptions` / `timeouts`
- `ManagementUserRole`, `ManagementUserSubscription`, `ManagementUserTimeout`
- `SearchResult` — lightweight search row shape

## UI contracts

- `AdminUserManagementPanelProps` — `{ onUserUpdate? }`
- `UserActionsMenuProps` — user row action callbacks (view, role, subscription, quota, export, timeout, revoke)

## Filtering & sorting

- `ColumnFilter` — column, `FilterOperator`, value, active flag
- `FilterableColumn`, `SortableColumn`, `ColumnSort`, `SortDirection`

`FilterOperator` includes text, date, empty/not-empty variants (see source enum).

---

**Sources:** `src/app/admin/components/UserManagementPanel/types.ts`