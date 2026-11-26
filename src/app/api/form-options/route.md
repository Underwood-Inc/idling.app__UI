---
title: /api/form-options
description: Card generator dropdown options from Postgres with in-memory cache
---

# /api/form-options

CRUD-adjacent access to the `form_options` table (card generator wizard / aspect ratios and similar UI config).

## GET

- **Auth:** none (public read of active rows).
- **Query:** optional `category` (Zod `GetFormOptionsQuerySchema`).
- **Cache:** in-process `Map` for **5 minutes** per category key (`category` or `all`).
- **SQL:** `SELECT ... FROM form_options WHERE is_active = TRUE`; filters by `category` when provided; parses `configuration` JSON when stored as string.
- **Response:** `{ success: true, data, cached? }` — grouped object when fetching all categories.

## POST

- **Auth:** `requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS)`.
- **Body:** `CreateFormOptionSchema` (category, key, name, description, sort_order, configuration, is_active).
- **Upsert:** `ON CONFLICT (category, key) DO UPDATE`; clears cache for category + `all`.

## DELETE

- **Auth:** admin as above.
- **Query:** `category` + `key` required (`DeleteFormOptionQuerySchema`).
- Soft-deactivates or removes per implementation in route tail (see source).

---

**Sources:** `src/app/api/form-options/route.ts`, `@lib/permissions/permissions`, `@lib/security/requireAdminApiAccess`