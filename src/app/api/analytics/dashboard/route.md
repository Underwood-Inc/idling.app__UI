---
title: GET /api/analytics/dashboard
description: Admin analytics aggregates for the stats dashboard
---

# GET /api/analytics/dashboard

Admin-only analytics bundle for [StatsDashboard](/app/components/stats-dashboard/StatsDashboard) and related UI.

## Handler

- **Runtime:** `nodejs`
- **Method:** `GET` via `withUniversalEnhancements(getHandler)`

## Auth

1. `auth()` session required — else `401`.
2. `checkUserPermission(userId, PERMISSIONS.ADMIN.ACCESS)` — else `403`.

## Query

Parsed with `DashboardQuerySchema` from search params, including:

- `dateRange`: `7d` | `30d` | `90d` | `1y`
- `metrics`: sessions, pageviews, clicks, users, geographic, devices, vpn, heatmap, subscriptions
- `granularity`: hourly | daily | weekly | monthly
- `timezone`, `country`, `device_type`, … (see OpenAPI block in route)

`getDateRange` converts range to `startDate` / `endDate`; handler fetches metric slices in parallel (implementation in lower half of `route.ts`).

---

**Sources:** `src/app/api/analytics/dashboard/route.ts`, `@lib/permissions/permissions`