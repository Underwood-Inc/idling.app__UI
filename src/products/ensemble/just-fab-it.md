---
title: Just Fab It
description: Paper plugin — region capture prefabs, fab sites, placement previews, Vault costs
---

# Just Fab It

**What this is:** Paper plugin **Just Fab It** (`com.jfi.plugin.JfiPlugin`, **`plugin_version` 1.0.6** in `gradle.properties`) — region-captured structure **fabs**, chest GUIs, flexible costs (XP / Vault), hologram placement previews, and protected **fab sites**.

## Entry (`plugin.yml`)

- **Main:** `com.jfi.plugin.JfiPlugin`
- **API:** `26.3`, `POSTWORLD`
- **softdepend:** Vault
- **Commands:** `jfi` (aliases `justfabit`, `justfab`, `prefabs`, `prefab`) — `help`, `admin`, `capture`, `select`, `create`, `give`, `list`, `confirm`, `cancel`, `reload`
- **Artifact:** shaded `jfi-plugin` JAR + `assembleServerDeploy` → `build/server-deploy/plugins/`

## Startup (`JfiPlugin.onEnable`)

1. `PluginConfig`, `FabStore`, `SiteStore` load from disk.
2. `RegionSelectionService` + preview listener; `PlayerSessionService`.
3. `VaultHook.tryHook()` → `FabCostService`, `FabWorthCatalog`, `FabCaptureService`.
4. `JfiCommand` bound to `jfi`.
5. GUI listeners: `FabMenuListener`, `FabSiteMenuListener`, `CaptureChatListener`, `SelectionListener`.
6. Placement pipeline: `FabPreviewService`, `FabBuildSiteService`, `FabPlacementConfirmService`, `FabPlacementEditService` + placement/anchor/chat listeners; site protection + interact.
7. `ShirecraftRuntime.shared().install(...)` with bootstrap presence theme **Prefab fabrication** (`/jfi` quick start).

## Permissions (`plugin.yml`)

| Node | Default | Role |
| ---- | ------- | ---- |
| `jfi.use` | true | Player hub |
| `jfi.place` / `jfi.create` / `jfi.manage.own` | true | Place, capture, edit own fabs |
| `jfi.admin` | op | Admin GUI, reload, give |
| `jfi.bypass.cost` | op | Skip placement/create costs |
| `jfi.cost.admin` | op | Free / flat cost modes on personal prefabs |
| `jfi.place.*` | op | Place any fab by id |

## Build (`plugin/build.gradle.kts`)

- Paper API `26.3.build.+`, shades **`shirecraft-bukkit-utils`** + Gson via `includeBuild` on utils
- Deploy: `copyPluginToDeploy` copies JAR to `build/server-deploy/plugins/`

## Failure modes

| Issue | Where to look |
| ----- | ------------- |
| Economy costs ignored | Vault hook state — `logIntegrationStatus()` on enable |
| Placement stuck in preview | `FabPlacementConfirmService`, boss bar / chat listeners |
| Worth catalog warnings | `FabWorthCatalog`, `SoftDependencies.worthCatalog()` |

## Ensemble links

Shared runtime: [shirecraft-bukkit-utils](/products/ensemble/shirecraft-bukkit-utils). Compare prefab UX: [Compressy](/products/showcase/compressy) `compressy.prefab.*` (WIP admin prefab nodes).

---

**Sources (audited):** `just-fab-it/plugin/src/main/resources/plugin.yml`, `just-fab-it/plugin/src/main/java/com/jfi/plugin/JfiPlugin.java`, `just-fab-it/plugin/build.gradle.kts`, `just-fab-it/gradle.properties`