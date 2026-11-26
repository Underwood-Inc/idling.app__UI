---
title: UserManagementPanel hooks
description: Data, search, filter, sort, and pagination hooks
---

# User management hooks

## Data

- **`useUsersData`** — `noCacheFetch('/api/admin/users?page=&limit=20')`, exposes `loadUsers`, `goToPage`, error state
- **`useSmartSearch`** — debounced-style search via `GET /api/admin/users/search?q=` (min 2 chars)

## Filters & sort

- **`useColumnFiltering`** — `ColumnFilter[]`, apply to `ManagementUser[]`, panel visibility
- **`useColumnSorting`** — tri-state sort per column, `getSortIndicator`

## Display modes

- **`useInfiniteScroll`** — appends `USERS_PER_LOAD` chunks, `loadMoreUsers`
- **`usePaginatedUsers`** — slices by `USERS_PER_PAGE` for traditional mode

Shared helper `getFieldValue` from `./utils` for filter matching.

---

**Sources:** `src/app/admin/components/UserManagementPanel/hooks.ts`