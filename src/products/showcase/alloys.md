---
title: Alloys
description: Optional Paper wrapper for the Alloys 26.3 datapack — recipe GUI and guidebook
---

# Alloys

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: STARTUP`) for the **Alloys** fantasy-metals datapack. The plugin does **not** implement gameplay rules — it installs the zip, enables the pack after world load, and exposes recipe browser, written guidebook, and `/alloys` commands.

## Entry (`plugin.yml`)

- **Main:** `com.alloys.plugin.AlloysPlugin`
- **Commands:** `/alloys` (alias `alloy`) — `help`, `recipes`, `guidebook`, `give`, `reload`

## Startup (`AlloysPlugin.onEnable`)

1. `PluginConfig` reload; `DatapackBridge`.
2. `datapackInstaller.installAfterEnable()`; deferred task calls `datapackBridge.ensureAlloysDatapackEnabled()`.
3. Fresh install warns to **full restart** if `/reload` raced pack enable (proj enchants / loot tables).
4. Missing zip → **severe** with manual copy instructions.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `alloys.use` | true | Recipe browser, chat viewer, guidebook |
| `alloys.give` | op | Operator test kits / welcome book |
| `alloys.admin` | op | Reload and operator give |

Repo folder: `alloys` (datapack id on Modrinth: `s-alloys`).

## Failure modes

| Issue | Check |
| ----- | ----- |
| Enchants not registered | Stop/start after first install per boot warning |
| Recipes empty | Datapack enabled in default world; `Alloys.zip` in `datapacks/` |

---

**Sources (audited):** `alloys/plugin/src/main/resources/plugin.yml`, `alloys/plugin/src/main/java/com/alloys/plugin/AlloysPlugin.java`