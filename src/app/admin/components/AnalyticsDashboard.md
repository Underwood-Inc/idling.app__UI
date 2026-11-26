---
title: AnalyticsDashboard
description: Tabbed admin analytics charts fed by /api/analytics/dashboard
---

# AnalyticsDashboard

Default export — subscription and usage analytics with date-range filtering and multi-tab breakdowns.

## Props

| Prop | Default |
|------|---------|
| `dateRange` | `'30d'` — also `7d`, `90d`, `1y` |
| `onDateRangeChange` | optional callback when range changes |

## Data

- `fetch` → `GET /api/analytics/dashboard?dateRange={range}`
- Response typed as `AnalyticsDashboardResponse` from `src/app/api/analytics/dashboard/route`.
- Copy strings from `useAdminCopy().analytics`.

## UI tabs

`activeTab` cycles: `overview`, `geography`, `devices`, `behavior`, `heatmap`, `subscriptions`.

Each tab renders metrics/cards/charts from `analyticsData` (loading and error states handled at shell level).

---

**Sources:** `src/app/admin/components/AnalyticsDashboard.tsx`, `src/app/admin/components/AnalyticsDashboard.css`, `src/app/api/analytics/dashboard/route.ts`