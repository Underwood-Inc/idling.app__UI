---
title: HomeMinecraftShelf
description: Home section grid of Minecraft product chips
---

# HomeMinecraftShelf

Client section listing Minecraft-related products from marketing catalog as small tiles.

## Exports

- `HomeMinecraftShelf` — named export, no props

## Behavior

- `listHomeMinecraftProjects()` drives `HomeProductTile` map (`size="chip"`).
- Section `id="minecraft"`, `aria-labelledby="home-minecraft-title"`, title **Minecraft mods & server**.
- Shelf layout reuses `dash__shelf` from marketing dashboard CSS; section spacing from `home-landing.module.css`.

---

**Sources:** `src/app/components/home-landing/HomeMinecraftShelf.tsx`, `src/app/components/home-landing/home-landing.module.css`, `src/app/components/marketing-dashboard/productMarketing`, `src/app/components/marketing-dashboard/HomeProductTile`