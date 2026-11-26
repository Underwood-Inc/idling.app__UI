---
title: HomeProductTile
description: Category-styled dashboard tile for a showcase project
---

# HomeProductTile

Marketing grid tile for a `ProjectShowcaseProject` at `hero`, `wide`, or `chip` size.

## Presentation

- Wrap and tile modifiers from `marketing-dashboard.module.css` (`dash__tileWrap--*`, category tint: Minecraft, Streaming, Web Tools, Gaming).
- Lucide category icon, title, hook from `productMarketingHook`, primary CTA from `getHomeProductPrimaryLink` (internal `Link` or external anchor with `ArrowUpRight`).

Also exports `HomeProductTileSize` and internal `HomeProductTileWrap` for layout composition.

---

**Sources:** `src/app/components/marketing-dashboard/HomeProductTile.tsx`, `src/app/components/marketing-dashboard/productMarketing.ts`