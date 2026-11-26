---
title: /api/admin/alerts/[id]
description: Single custom alert fetch, update, delete
---

# /api/admin/alerts/[id]

Co-located with `route.ts`. **Runtime:** `nodejs`, `force-dynamic`. No rate-limit wrapper on handlers.

## Auth

`auth()` session; admin/moderator via `user_role_assignments` + active role name in `('admin','moderator')`.

## GET

Returns full `custom_alerts` row by numeric `id`.

## PUT

`UpdateAlertSchema` — partial fields (`title`, `message`, `alert_type`, `priority`, audience targeting, scheduling, `is_published`, JSON `actions`/`metadata`). Dynamic SQL via `sql.unsafe`; sets `updated_by`.

## DELETE

Hard delete from `custom_alerts`, returns deleted row.

---

**Sources:** `src/app/api/admin/alerts/[id]/route.ts`