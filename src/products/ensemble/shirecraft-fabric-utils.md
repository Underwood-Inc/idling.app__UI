---
title: Shirecraft Fabric Utils
description: Fabric library mod — datapack product runtime, command bridge, chest admin GUIs on dedicated servers
---

# Shirecraft Fabric Utils

**What this is:** Fabric **library mod** (`com.shirecraft:shirecraft-fabric-utils`, v**1.0.2** in `gradle.properties`) built with **Loom 1.17**, Minecraft **26.3**, Fabric Loader **0.19.3**, Fabric API **0.160.5+26.3**. Products depend on this JAR for shared server lifecycle, datapack bridges, and Paper-style chest admin menus on Fabric dedicated servers.

## Entry (`fabric.mod.json`)

- **id:** `shirecraft-fabric-utils`
- **entrypoints.main:** `com.shirecraft.fabric.ShirecraftFabricUtils`
- **depends:** `fabricloader >=0.19.3`, `minecraft 26.3`, `fabric-api *`

## Bootstrap (`ShirecraftFabricUtils`)

`ModInitializer.onInitialize()` — logs load; library surface is consumed by product mods, not player-facing commands in this artifact alone.

## Runtime molecules (`AGENTS.md` + sources)

| Type | Class | Role |
| ---- | ----- | ---- |
| Product lifecycle | `FabricProductRuntime` | `SERVER_STARTED` → `FabricDatapackProduct.bindServer`; Brigadier registration hook |
| Datapack bridge | `DatapackFunctionBridge`, `FabricDatapackProduct` | Dispatch `namespace:admin/*` functions; embed datapack on server start |
| Admin GUI | `ChestMenuScreens`, `ActionChestMenu`, `ChestMenuClickHandler`, `AdminMenuButtonFactory`, `AdminHubLayoutSlots` | Chest menus mirroring Paper admin patterns |
| Commands | `FabricCommands`, `CommandMessages` | Shared command helpers |

Pure search + `DatapackProductSpec` live in [shirecraft-platform-core](/products/ensemble/shirecraft-platform-core).

## Consumer setup

`settings.gradle.kts`: `includeBuild("../shirecraft-platform-core")` + `includeBuild("../shirecraft-fabric-utils")`; product `build.gradle.kts` uses `modImplementation("com.shirecraft:shirecraft-fabric-utils")`. Embed datapack JSON under `src/main/resources/data` / `assets`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Admin functions not firing | `DatapackFunctionBridge` + product `bindServer` |
| Commands missing on dedicated | `FabricProductRuntime.install` + product `CommandRegistrar` |

---

**Sources (audited):** `shirecraft-fabric-utils/build.gradle.kts`, `shirecraft-fabric-utils/gradle.properties`, `shirecraft-fabric-utils/src/main/resources/fabric.mod.json`, `shirecraft-fabric-utils/src/main/java/com/shirecraft/fabric/ShirecraftFabricUtils.java`, `shirecraft-fabric-utils/src/main/java/com/shirecraft/fabric/product/FabricProductRuntime.java`, `shirecraft-fabric-utils/AGENTS.md`