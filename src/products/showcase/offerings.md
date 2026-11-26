---
title: Offerings
description: Paper plugin — weighted daily kit lottery with chest GUIs and admin tooling
---

# Offerings

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: POSTWORLD`) for daily weighted kit draws — chest menus, loot tables, streaks, milestones, achievements, and operator admin GUIs. Loads before Compressy and ShireSell.

## Entry (`plugin.yml`)

- **Main:** `com.offerings.OfferingsPlugin`
- **Commands:** `/offerings` (aliases `offering`, `offer`, `rewards`); `/stipend` (aliases `pay`, `salary`) — usage includes `claim`, `opencrates`, `catalog`, `milestones`, …
- **Soft depend:** PlaceholderAPI

## Startup (`OfferingsPlugin.onEnable`)

1. `OfferingsIntegrations.registerAll()`; default config + `achievements.yml`.
2. `TextEngine`, `PlaceholderHook`, full `reloadAll()`.
3. `IdentificationForgeStore` load; `OfferingsCommand` + hub command alias sync.
4. Menu listeners: player chest flows, admin GUIs, catalog anvil search.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `offerings.use` | true | Open chest menus and claim draws |
| `offerings.lookup` | true | Browse other players in directory |
| `offerings.admin` | op | Reload, reset, admin GUIs |
| `offerings.bypass` | op | All gated tiers/kits/loot tables |
| `offerings.*` | op | Wildcard |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Placeholders blank | PlaceholderAPI present; `PlaceholderHook` registration |
| Command aliases wrong | `HubCommandAliasRegistrar` after config reload |
| Catalog identity drift | `IdentificationForgeStore`; [shirecraft-bukkit-utils](/products/ensemble/shirecraft-bukkit-utils) pipeline |

---

**Sources (audited):** `offerings/plugin/src/main/resources/plugin.yml`, `offerings/plugin/src/main/java/com/offerings/OfferingsPlugin.java`