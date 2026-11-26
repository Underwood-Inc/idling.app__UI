---
title: productMarketing.types
description: Type contracts for home hub and product marketing UI
---

# productMarketing.types

Shared TypeScript interfaces for marketing-dashboard modules. `ProductMarketingProject` is an alias of `ProjectShowcaseProject`.

## Key shapes

- **Links:** `ProductMarketingLink`, `ProductMarketingPrimaryLink`, `HomeHubLearnMoreLink` — `href`, `label`, `external`.
- **Hub chapter:** `HomeHubChapter` merges resolved `project`, copy (`headline`, `pitch`, `highlights`), `visual`, `learnMore`, `primary`, `proprietary`.
- **Config:** `HomeHubChapterConfig` (static ids + headline + visual); `HomeHubTileVisual` (`src`, `alt`, optional `fit`).
- **Dashboard copy:** `ProductMarketingDashboardCopy`, `ProductMarketingExploreLink`, `ProductMarketingHighlight`.

Consumers: `homeHubCatalog.ts`, `HomeProductHub.tsx`, `HomeHubTileVisual.tsx`.

---

**Sources:** `src/app/components/marketing-dashboard/productMarketing.types.ts`