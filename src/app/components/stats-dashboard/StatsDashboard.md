---
title: StatsDashboard
description: Aggregate portfolio metrics dashboard
---

# StatsDashboard

Client dashboard using localized `PORTFOLIO_EN` stats copy, `fetchModrinthShowcaseMetrics`, and static GitHub star fetch where configured.

Renders metric cards (`Card`) for total projects, Modrinth downloads/followers, GitHub stars, and quick links from `STATS_QUICK_LINKS` with `SiteIcon` ids from `siteIconCatalog`. Counts formatted via `formatModrinthCount`. Styles: `StatsDashboard.module.css`.

---

**Sources:** `src/app/components/stats-dashboard/StatsDashboard.tsx`, `src/app/components/project-showcase/modrinthShowcaseStats.ts`