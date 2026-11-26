---
title: ProductModrinthStats
description: Client fetch of Modrinth metrics for one showcase project
---

# ProductModrinthStats

Props: `{ projectId: string }`.

On mount, calls `fetchModrinthShowcaseMetrics()` once (cleanup on unmount). Passes `metrics?.[projectId]` into `ProjectShowcaseMetrics`. Failed fetches render metrics as empty/undefined rather than throwing.

---

**Sources:** `src/app/components/marketing-dashboard/ProductModrinthStats.tsx`, `src/app/components/project-showcase/modrinthShowcaseStats.ts`