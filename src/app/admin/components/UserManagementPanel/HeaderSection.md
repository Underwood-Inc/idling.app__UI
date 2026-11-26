---
title: HeaderSection
description: User panel header with search, filters, and export
---

# HeaderSection

Named export — top bar for `UserManagementPanel`.

## Props

Filter badge count, search query/overlay content, searching flag, and handlers: `onToggleFilterPanel`, `onExportAll`, search change/focus/blur/clear.

## UI

- Title/description from `useAdminCopy().userManagement`
- Filter toggle with active count
- Export-all control
- Search input with `InteractiveTooltip` hosting `searchOverlayContent` (smart search results from parent)

---

**Sources:** `src/app/admin/components/UserManagementPanel/HeaderSection.tsx`