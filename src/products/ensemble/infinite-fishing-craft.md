---
title: Infinite Fishing Craft
description: Paper companion for InfiniteFishing — rod recipes and recipe-book GUI
---

# Infinite Fishing Craft

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: STARTUP`) that registers survival crafting recipes and a recipe chest GUI for **InfiniteFishing** rods. **Hard depend:** `InfiniteFishing`.

## Entry (`plugin.yml`)

- **Main:** `com.shirecraft.infinitefishingcraft.InfiniteFishingCraftPlugin`
- **Commands:** `/fishingcraft` (aliases `rodrecipes`, `ifcraft`) — `recipes`, `edit`, `reload`, `status`

## Startup (`InfiniteFishingCraftPlugin.onEnable`)

1. `PluginConfig`; `InfiniteFishingBridge`; `RodRecipeCatalog` + `RodRecipeRegistrar`.
2. `FishingCraftCommand.register`; listeners for craft, GUI, join recipe discovery, InfiniteFishing enable events.
3. `ChatSearchListener` for recipe search; **scheduled bind attempts** at 1, 20, 60, 200 ticks until InfiniteFishing API attaches.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `fishingcraft.use` | true | Open rod recipe chest GUI |
| `fishingcraft.admin` | op | Reload recipes and config |

## Failure modes

| Issue | Check |
| ----- | ----- |
| GUI empty | InfiniteFishing plugin enabled; bind attempt logs |
| Recipes missing in book | `JoinRecipeDiscoveryListener`, `RodRecipeRegistrar` |

Also wired in **Compressy** identity policies (`InfiniteFishingIdentityPolicy`).

---

**Sources (audited):** `infinitefishing-craft/plugin/src/main/resources/plugin.yml`, `infinitefishing-craft/plugin/src/main/java/com/shirecraft/infinitefishingcraft/InfiniteFishingCraftPlugin.java`