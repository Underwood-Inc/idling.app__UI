---
title: ProjectShowcaseMetrics
description: Modrinth download and server stat chips for a project
---

# ProjectShowcaseMetrics

Props: optional `ModrinthProjectMetrics`, optional `modrinthMetricsNote` for tooltip copy.

Renders nothing when `metrics` is undefined. **Content** projects show downloads and followers; **server** projects show players, verified plays, region, etc. Uses `formatModrinthCount` and `InteractiveTooltip` on the info affordance.

---

**Sources:** `src/app/components/project-showcase/ProjectShowcaseMetrics.tsx`, `src/app/components/project-showcase/modrinthShowcaseStats.ts`