---
title: Portfolio page
description: Long-form home/portfolio with about, ecosystem, projects, stats
---

# Portfolio page

Server Component (also used as rich marketing home content in routes that embed it).

## Metadata

`buildPortfolioPageMetadata()` from `@molecules/i18n/idlingMeta`.

## Sections (anchor IDs)

1. `#about` — `About` in full-width `Card`
2. AdUnit `home-ad-1`
3. `#ecosystem` — `EcosystemDiagram`
4. AdUnit `home-ad-2`
5. `#projects` — `ProjectShowcase`
6. `#stats` — `StatsDashboard` in aside column

Uses shared `page.module.css` layout classes (`home__layout`, `home__anchor`).

## Auth

None at page level.

---

**Sources:** `src/app/portfolio/page.tsx`