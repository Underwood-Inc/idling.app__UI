---
title: GET /api/admin/users
description: Paginated admin user directory
---

# GET /api/admin/users

**Runtime:** `nodejs`, **dynamic:** `force-dynamic`. `withUniversalEnhancements` on `GET`.

## Auth

`requireAdminApiAccess(PERMISSIONS.ADMIN.USERS_VIEW)` — returns prebuilt 401/403 response when denied.

## Query

`AdminUserSearchParamsSchema`: `page`, `limit`, `search` (matches name, email, provider name).

## Response

`{ users, currentPage, totalPages, pagination }`. Each `AdminUser` row joins LATERAL helpers: `get_user_primary_provider`, `get_user_role_summary`, `get_user_subscription_summary`, `get_user_timeout_status`.

Structured logging via `createLogger` (`admin-users-api`).

---

**Sources:** `src/app/api/admin/users/route.ts`