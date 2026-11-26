---
title: modrinthShowcaseStats
description: Modrinth API aggregation for showcase projects
---

# modrinthShowcaseStats

## Types

- `ModrinthContentMetrics` — `kind: 'content'`, downloads, followers.
- `ModrinthServerMetrics` — online/max players, verified 2w plays, region label, version.
- `ModrinthMetricsByProjectId` — map keyed by internal project id.

## API

- `fetchModrinthShowcaseMetrics()` — parallel v3 requests for `PROJECT_SHOWCASE_MODRINTH_PROJECTS`, normalizes content vs server shapes.
- `formatModrinthCount(num)` — compact human-readable counts for UI.

User-Agent: `idling.app/1.0` with GitHub contact URL.

---

**Sources:** `src/app/components/project-showcase/modrinthShowcaseStats.ts`, `src/app/components/project-showcase/projectShowcaseProjects.ts`