---
title: homeHubContent
description: Static home hub structure and English copy helpers
---

# homeHubContent

## `HOME_HUB_STRUCTURE`

Ordered non-translatable config per featured product: `projectId`, i18n highlight keys, marketing visual asset, learn-more href/external flag, optional `proprietary`, optional `builtWithLabels` for product detail pages only.

## Helpers

- `getHomeHubContentEntry(projectId)` — structure row plus English hub copy from `en.json` hub entries.
- `listProductMarketingHighlightsForProject(project)` — highlight bullets for `/products/[id]`.
- `listProductMarketingBuiltWithLabels(projectId)` — tech labels for detail “Built with” section.

Highlight key catalog: `HOME_HUB_HIGHLIGHT_KEYS` in `@molecules/i18n/idlingProductMarketingI18n`.

---

**Sources:** `src/app/components/marketing-dashboard/homeHubContent.ts`, `src/i18n/locales/en.json`