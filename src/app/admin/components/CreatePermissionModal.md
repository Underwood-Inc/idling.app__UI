---
title: CreatePermissionModal
description: Zod-validated modal to POST new admin permissions
---

# CreatePermissionModal

Default export — modal form for creating permissions in the RBAC catalog.

## Props

| Prop | Role |
|------|------|
| `isOpen` / `onClose` | visibility |
| `onSuccess` | refresh parent list after create |
| `existingCategories` | suggest category dropdown values |
| `existingPermissions` | dependency picker source |

## Validation

`PermissionSchema` (zod): `name` (slug regex), `display_name`, optional `description`, `category`, `is_inheritable`, `risk_level` (`low`–`critical`), optional `dependencies`, optional admin `reason`.

## API

Successful submit → `POST /api/admin/permissions` with JSON body matching schema.

---

**Sources:** `src/app/admin/components/CreatePermissionModal.tsx`, `src/app/admin/components/CreatePermissionModal.css`