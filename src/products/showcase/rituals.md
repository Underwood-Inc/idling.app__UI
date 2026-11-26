---
title: Rituals
description: Paper bridge plugin for the Rituals datapack — permissions, config GUI, integrations
---

# Rituals

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: STARTUP`) that ships and manages the **Rituals datapack** zip, exposes `/rituals` admin and player commands, and optional Vault / PlaceholderAPI hooks. Core gameplay lives in the datapack; the plugin handles install, config chest, and integrations.

## Entry (`plugin.yml`)

- **Main:** `com.rituals.plugin.RitualsPlugin`
- **Commands:** `/rituals` (alias `ritual`) — `help`, `config`, `reload`, `give`, `soul`, `guide`, `admin`
- **Soft depend:** Vault, PlaceholderAPI

## Startup (`RitualsPlugin.onEnable`)

1. `PluginConfig` reload; `DatapackBridge`.
2. `datapackInstaller.installAfterEnable()` — logs **severe** if zip missing from `world/datapacks/`.
3. `RitualsCommand` registered with tab complete.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `rituals.use` | true | Player commands and config menu when allowed |
| `rituals.config` | op | Config chest + datapack config reload |
| `rituals.give` | op | Totems and guidebook via `/rituals give` |
| `rituals.soul` / `rituals.soul.rename` | true | Soul weapon info and rename |
| `rituals.admin` | op | Kiwi mode, debug, reset |
| `rituals.bypass.fire` | op | Reserved future fire-sacrifice bypass |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Datapack not loading | Boot log from `datapackInstaller`; `datapack.auto-install` in plugin config |
| Integrations inactive | Vault / PlaceholderAPI optional — expected when absent |

Marketing card: `projectShowcaseProjects.ts` (`id: rituals`, Modrinth `rituals`).

---

**Sources (audited):** `rituals/plugin/src/main/resources/plugin.yml`, `rituals/plugin/src/main/java/com/rituals/plugin/RitualsPlugin.java`