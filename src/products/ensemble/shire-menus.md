---
title: ShireMenus
description: Config-driven chest menus that bridge hub, Offerings, ShireSell, and Essentials
---

# ShireMenus

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: POSTWORLD`) — YAML-driven chest menus with command actions, join auto-open by LuckPerms group, hub dashboard with market pulse ticker, and soft bridges to Nexo, Offerings, ShireSell, Rituals, and more.

## Entry (`plugin.yml`)

- **Main:** `com.shirecraft.menus.ShireMenusPlugin`
- **Commands:** `/menus` (aliases `smenus`, `chestmenu`, `menubridge`) — `open <id>`, `list`, `reload`
- **Soft depend:** Nexo, PlaceholderAPI, LuckPerms, Offerings, Essentials, AxTrade, BackpackPlus, voicechat, Rituals, ShireSell

## Startup (`ShireMenusPlugin.onEnable`)

1. Default config; ensure menu folder; `PluginSettings`, `RoleMenuResolver`, `MenuRepository`, `MenuService`, `ActionExecutor`.
2. `DashboardMarketPulseTicker` bound for hub economy lore.
3. `MenuCommandRegistrar`; warnings when LuckPerms / Essentials / ShireSell absent (degraded lore only).

## Permissions (selected)

| Node | Default | Role |
| ---- | ------- | ---- |
| `shiremenus.use` | true | `/menus`, `/hub`, aliases |
| `shiremenus.admin` | op | Reload, list, admin tutorial |
| `shiremenus.join.auto` | true | Role menu on join |
| `shiremenus.open.dashboard` | true | Player hub and branches |
| `shiremenus.panel.staff` | false | Staff mode on hub |
| `shiremenus.panel.admin` | op | Admin mode on hub |
| `shiremenus.open.welcome` / `example` | true | Tutorial menus |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Menu not found | `plugins/ShireMenus/menus/` YAML ids vs `/menus list` |
| Market pulse offline | ShireSell not loaded — expected info log |
| Join menu wrong role | LuckPerms groups + `shiremenus.join.auto` |

---

**Sources (audited):** `shirecraft-menus/plugin/src/main/resources/plugin.yml`, `shirecraft-menus/plugin/src/main/java/com/shirecraft/menus/ShireMenusPlugin.java`