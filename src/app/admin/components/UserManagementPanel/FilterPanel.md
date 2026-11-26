---
title: FilterPanel
description: Column filter builder for the user management table
---

# FilterPanel

Named export — slide-out / toggled UI for stacking column filters.

## Props

Callbacks: `onTogglePanel`, `onClearAllFilters`, `onAddFilter`, `onUpdateFilter`, `onRemoveFilter`. State: `columnFilters`, `activeFiltersCount`, `showFilterPanel`.

## Behavior

Uses `FILTERABLE_COLUMNS`, `getValidOperators`, and `getOperatorLabel` from `constants.ts` to render operator/value controls per filter row.

Does not fetch data — parent applies filters via `useColumnFiltering`.

---

**Sources:** `src/app/admin/components/UserManagementPanel/FilterPanel.tsx`, `src/app/admin/components/UserManagementPanel/constants.ts`