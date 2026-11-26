---
title: CustomAlertsPanel
description: CRUD admin UI for targeted site-wide custom alerts
---

# CustomAlertsPanel

Default export — full lifecycle management for custom alerts (create, edit, publish, disable, analytics).

## Data layer

- List: `noCacheFetch('/api/admin/alerts')`
- Mutations: `noCacheFetch` to `/api/admin/alerts` and `/api/admin/alerts/{id}` (POST/PATCH/DELETE patterns in source)

## Features

- Alert types map to `ALERT_TYPE_ICON_IDS` (`info`, `warning`, `error`, `success`, `maintenance`, `custom`).
- Targeting: all users, authenticated, subscribers, admins, roles, specific users (see form sections in source).
- Scheduling, priority, active vs published toggles — `AlertStatusTooltip` documents semantics inline.
- `useAdminCopy()` for localized labels; `forceLog` bypasses console silencer for debug trails.

---

**Sources:** `src/app/admin/components/CustomAlertsPanel.tsx`, `src/app/admin/components/CustomAlertsPanel.css`, `src/app/admin/components/AlertStatusTooltip.tsx`