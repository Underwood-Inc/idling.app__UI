---
title: productMarketing
description: Catalog IDs, copy resolvers, and outbound links for home marketing
---

# productMarketing

Central marketing data layer over `PROJECT_SHOWCASE_PROJECTS`.

## Constants

- `FEATURED_PRODUCT_IDS` / `HOME_PRODUCT_IDS` — hub spotlight order (Overlane, Mappy, offerings, mods-hub, OBS suite, card-generator).
- `HOME_MINECRAFT_IDS` — shelf projects; `HOME_HUB_FEATURED_MINECRAFT_ID` (`offerings`) gets a full chapter.
- `DASHBOARD_COPY` — English fallback strings for legacy dashboard copy.

## List builders

| Function | Purpose |
|----------|---------|
| `listHomeMinecraftProjects` | Minecraft ids not in featured set, with valid primary link |
| `listHomeMarketingTiles` | Hero/wide featured tiles + chip rows for shelf |
| `listHomeAudienceProjects` / `listHomeFilmstripProjects` | Filtered showcase subsets |
| `listFeaturedProductProjects` / `listProductMarketingIds` | Id lookups |

## Copy and links

- `productMarketingHook`, `productMarketingAudienceLine`, `productMarketingSummary`, `productMarketingTagline`, `productMarketingStatusLabel` — locale-aware via `@molecules/i18n/idlingProductMarketingI18n`.
- `getHomeProductPrimaryLink` / `getProductMarketingPrimaryLink` — first usable link among live, marketplaces, demo, etc.
- `listProductMarketingLinks`, `getProductMarketingTourHref` — detail page CTAs.

---

**Sources:** `src/app/components/marketing-dashboard/productMarketing.ts`, `src/app/components/project-showcase/projectShowcaseProjects.ts`