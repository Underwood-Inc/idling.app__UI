---
title: PermissionManagementPanel
description: Full CRUD admin table for permissions with stats and audit actions
---

# PermissionManagementPanel

Default export — permissions catalog browser with search, filters, tabs, and lifecycle actions (disable, archive).

## API

- `noCacheFetch('/api/admin/permissions?{params}')` — paginated list with filters
- Detail/stats and mutation endpoints via `noCacheFetch` in panel handlers (disable, archive, restore)

## Permission record

Includes `risk_level`, `is_inheritable`, `dependencies`, usage counters (`usage_count`, `role_count`, `user_count`), archive metadata.

Integrates with permission creation flow (parent may open `CreatePermissionModal`). Copy via `useAdminCopy()`.

Styles: `PermissionManagementPanel.css`.

---

**Sources:** `src/app/admin/components/PermissionManagementPanel.tsx`, `src/app/admin/components/PermissionManagementPanel.css`