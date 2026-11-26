---
title: PaginationSection
description: Traditional and infinite-scroll pagination footer
---

# PaginationSection

Named export — footer stats and page controls.

## Props

| Prop | Role |
|------|------|
| `paginationMode` | `'traditional'` \| `'infinite'` |
| `currentPage` / `totalPages` | server pagination (traditional) |
| `paginatedUsers` / `filteredUsers` / `users` | counts for summaries |
| `activeFiltersCount` | adjusted totals in copy |
| `hasMoreUsers` | infinite mode |
| `onGoToPage` | traditional navigation |

Renders range text (“showing X–Y of Z”) and prev/next or infinite “load more” hints per mode (see component markup).

---

**Sources:** `src/app/admin/components/UserManagementPanel/PaginationSection.tsx`