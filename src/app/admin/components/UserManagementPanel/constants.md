---
title: UserManagementPanel constants
description: Column configs and filter operator labels
---

# User management constants

## Pagination

- `USERS_PER_PAGE` = 10 (traditional pagination slices)
- `USERS_PER_LOAD` = 10 (infinite scroll chunk)

## Columns

`FILTERABLE_COLUMNS` — name, email, provider (select), roles, timeout status (boolean), plans (select), timeout reason, join date.

`SORTABLE_COLUMNS` — table headers including custom sort fns for name (fallback to id), role count/names, subscription tier hierarchy (free < premium < pro), timeout expiry, dates.

## Helpers

- `getValidOperators(columnType)` — operator list per column type
- `getOperatorLabel(operator)` — human labels for filter UI

---

**Sources:** `src/app/admin/components/UserManagementPanel/constants.ts`