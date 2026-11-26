---
title: projectShowcaseProjects
description: Canonical portfolio project records and Modrinth ids
---

# projectShowcaseProjects

## `ProjectShowcaseProject`

Fields include `id`, `title`, `description`, `category`, `type`, `status`, `icon`, `links` (`ProjectShowcaseProjectLinks`: live, demo, modrinth, builtByBit, modsHub, github, etc.), and marketing metadata used by home hub and product detail pages.

## Catalog

- `PROJECT_SHOWCASE_PROJECTS` — master array consumed by showcase, marketing-dashboard, and stats surfaces.
- `PROJECT_SHOWCASE_MODRINTH_PROJECTS` / `ProjectShowcaseModrinthProject` — Modrinth slug mapping for metrics fetch.

Category type excludes filter pseudo-category `All`.

---

**Sources:** `src/app/components/project-showcase/projectShowcaseProjects.ts`