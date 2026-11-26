---
title: UserManagementPanel components
description: Table cells, search overlay, and user actions menu
---

# User management UI pieces

Exported building blocks from `components.tsx`:

| Export | Role |
|--------|------|
| `UserActionsMenu` | per-row actions (view, assign role, subscription, quota, export, timeout, revoke) via `LoadingButton` + `SiteIcon` |
| `UserInfoCell` | avatar + `Username` presentation |
| `RolesCell` / `TimeoutDetailsCell` | specialized column renderers |
| `SearchOverlayContent` | typeahead results list for header search |
| `LoadingState` / `ErrorState` | panel-level status shells |
| `InfiniteScrollLoading` / `InfiniteScrollEnd` | infinite mode footers |

Copy via `useAdminCopy().userManagement` inside action menu.

---

**Sources:** `src/app/admin/components/UserManagementPanel/components.tsx`