---
title: HomeProductHub
description: Stack of localized home hub chapters for featured products
---

# HomeProductHub

Renders the `#products` section: one article per hub chapter from `listHomeHubChapters(ll)`.

## Per chapter

- **Header:** `HomeHubTileVisual`, eyebrow (category/proprietary + status), headline, product name and type.
- **Body:** pitch paragraph, highlight list (title + body).
- **Actions:** primary CTA from `getHomeProductPrimaryLink`; “learn more” via `HubLearnMoreLink` (Next `Link` vs external `<a>`).
- Appends `HomeHubMinecraftBand` for secondary Minecraft projects.

Accessibility: each tile uses `aria-labelledby` pointing at its `h2`.

---

**Sources:** `src/app/components/marketing-dashboard/HomeProductHub.tsx`, `src/app/components/marketing-dashboard/homeHubCatalog.ts`