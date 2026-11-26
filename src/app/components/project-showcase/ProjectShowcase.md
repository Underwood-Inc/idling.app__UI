---
title: ProjectShowcase
description: Filterable portfolio grid with Modrinth live metrics
---

# ProjectShowcase

Client portfolio browser. Props: optional `initialCategory` (`ProjectShowcaseCategoryId`, default `All`).

## Features

- Category filter chips from `PROJECT_SHOWCASE_CATEGORY_OPTIONS` with localized labels.
- Projects from `PROJECT_SHOWCASE_PROJECTS` merged via `withShowcaseCopy`.
- Fetches `fetchModrinthShowcaseMetrics` on mount; passes per-project metrics to `ProjectShowcaseMetrics`.
- Link rows for demo, Modrinth, BuiltByBit, mods hub, GitHub with Lucide icons.

Styles: `ProjectShowcase.module.css`; uses `contrast-safe-surface` on CTAs.

---

**Sources:** `src/app/components/project-showcase/ProjectShowcase.tsx`, `src/app/components/project-showcase/projectShowcaseProjects.ts`