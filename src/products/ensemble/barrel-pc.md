---
title: Barrel PC
description: Tiered vanilla-style barrel storage with drives, pagination, and LCD refresh
---

# Barrel PC

**What this is:** Paper plugin `barrel-pc` — physical **barrel PC** blocks with tiered storage, drive jukebox behavior, crafting recipes, and Shirecraft runtime integration.

## Entry (`plugin.yml`)

- **Main:** `com.barrelpc.BarrelPcPlugin`
- **API:** `26.3`, `POSTWORLD`
- **Commands:** `barrel-pc` / `barrelpc` / `bpc` / `barrels` — usage includes `recipes`, `reload`, `cleandisplays`, `give <tier> [player] [amount]`

## Startup (`BarrelPcPlugin.onEnable`)

1. `LegacyDataFolderMigration.migrateIfNeeded` on `onLoad`.
2. `BarrelPcConfiguration` installs defaults, reloads, `ConfigDefaultsMerger.mergeMissing`.
3. `BarrelPcIntegrations.registerProtectedPdcContributions()`.
4. Core services: `BarrelRegistry`, `BarrelStorage`, `BarrelItemFactory`, `BarrelVisuals`, `BarrelPlacementService`, `StorageDriveStorage`, `BarrelUpgradeService`, `BarrelInventoryCoordinator`, `BarrelPlayerSettingsStore`.
5. Listeners: break/place/interact/hopper/protection, recipe craft/discover, drive pickup/jukebox, menu + guide GUIs, anvil search.
6. `BarrelLcdRefreshTask` + `BarrelChunkLoader` for display entities across chunks.
7. `ShirecraftRuntime.shared().install(...)` and `BarrelCraftMatrixOverlay` registered with `CraftMatrixOverlayRegistry`.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `barrelpc.use` | true | Place and open tiers |
| `barrelpc.craft` | true | Craft PC tiers |
| `barrelpc.admin` | op | Reload, give, cleandisplays |
| `barrelpc.admin.reload` | op | Config reload |
| `barrelpc.admin.give` | op | Give PC items |
| `barrelpc.admin.cleandisplays` | op | Remove orphan display entities at player block |

## Failure modes

| Issue | Where to look |
| ----- | ------------- |
| Orphan LCD/armor stands | `/barrel-pc cleandisplays` — `BarrelVisuals`, protection listener |
| Items lost on break | `BarrelBreakListener`, `BarrelStorage` persistence |
| Recipe not showing | `BarrelRecipeRegistrar`, `RecipeDiscoverListener` |

---

**Sources (audited):** `barrel-pc/plugin/src/main/resources/plugin.yml`, `barrel-pc/plugin/src/main/java/com/barrelpc/BarrelPcPlugin.java`