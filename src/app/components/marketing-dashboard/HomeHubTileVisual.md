---
title: HomeHubTileVisual
description: Parallax marketing tile image with reduced-motion fallback
---

# HomeHubTileVisual

Client wrapper around `next/image` for hub chapter artwork (`HomeHubTileVisual` type: `src`, `alt`, optional `fit` `cover` \| `contain`).

## Motion

Unless `prefers-reduced-motion: reduce`, pointer position on the tile frame drives subtle transforms on glow, mid-layer, and shine elements (lerped via `requestAnimationFrame`). Motion listeners are skipped when reduced motion is preferred.

---

**Sources:** `src/app/components/marketing-dashboard/HomeHubTileVisual.tsx`, `src/app/components/marketing-dashboard/productMarketing.types.ts`