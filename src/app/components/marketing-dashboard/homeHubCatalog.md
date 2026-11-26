---
title: homeHubCatalog
description: Resolves static hub structure into localized HomeHubChapter rows
---

# homeHubCatalog

## `listHomeHubChapters(ll?)`

Maps `HOME_HUB_STRUCTURE` entries to `HomeHubChapter[]`:

1. Load base project via `getProductMarketingProject`; merge showcase i18n with `withShowcaseCopy` when `ll` is set.
2. Skip entries without project or `getHomeProductPrimaryLink`.
3. Merge copy from `resolveHomeHubCopy` (locale) or `getHomeHubContentEntry` (English fallback).
4. Attach learn-more link, visual alt override, and `proprietary` flag from structure.

## `getHomeHubMinecraftMoreLink(projectId, ll?)`

Secondary CTA for Minecraft shelf rows: prefers static `homeHubContent` learn-more, else demo/tour links with localized labels via `resolveMinecraftMoreLinkLabel`.

---

**Sources:** `src/app/components/marketing-dashboard/homeHubCatalog.ts`, `src/app/components/marketing-dashboard/homeHubContent.ts`