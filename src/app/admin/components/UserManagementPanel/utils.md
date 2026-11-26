---
title: UserManagementPanel utils
description: Field accessors and display formatters for user rows
---

# User management utilities

## Field access

- **`getFieldValue(user, field)`** — normalizes API/user fields for filtering (e.g. subscriptions → joined plan names or `'Free'`, `is_timed_out` → `'true'`/`'false'`)
- **`getDisplayValue(user, field)`** — UI labels (e.g. timeout → `Timed Out` / `Active`)

## Formatting

- **`formatDate`** — `en-US` locale date
- Additional helpers in file: plans display, status badges, subscription tier helpers (see exports in source)

Used by `UserTable`, filter engine, and export flows.

---

**Sources:** `src/app/admin/components/UserManagementPanel/utils.tsx`