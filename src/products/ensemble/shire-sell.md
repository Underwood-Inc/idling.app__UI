---
title: ShireSell
description: Essentials-backed sell chest GUI with catalog identity and market ledger
---

# ShireSell

**What this is:** **Paper** plugin (`api-version: 26.3`, `load: POSTWORLD`) — Essentials addon that prices items from `worth.yml`, opens sell chest GUIs, buyback chests, hopper automation, and public market history. Catalog identity flows through **shirecraft-bukkit-utils**.

## Entry (`plugin.yml`)

- **Main:** `com.shirecraft.sell.ShireSellPlugin`
- **Depend:** Essentials
- **Soft depend:** Vault, Compressy, InfiniteFishing, AdvancedEnchantments, Offerings
- **Commands:** `/sell` (aliases `sellgui`, `sellchest`); `/price` (held-item breakdown)

## Startup (`ShireSellPlugin.onEnable`)

1. `IdentityEnvironment.register(ShireSellIdentityPolicy)`; third-party identity integrations.
2. `ShireSellIntegrations.registerProtectedPdcContributions()` and catalog aliases from config.
3. Worth catalog reload, sell chest services, GUI listeners, hopper automation policies.

## Permissions

| Node | Default | Role |
| ---- | ------- | ---- |
| `shiresell.use` | true | Sell chest, prices, sell actions |
| `shiresell.automation.configure` | true | Hopper automation on owned chests |
| `shiresell.buyback.use` | true | Buyback chest |
| `shiresell.history` | true | Market rotation / sell ledger |
| `shiresell.admin` | op | Reload worth, give chests, admin GUI |

## Failure modes

| Issue | Check |
| ----- | ----- |
| Zero sell price | Essentials `worth.yml`; `catalog-aliases.shiresell` in config |
| Custom items not priced | `CatalogIdentityPipeline` — [shirecraft-bukkit-utils](/products/ensemble/shirecraft-bukkit-utils) |

---

**Sources (audited):** `shire-sell/plugin/src/main/resources/plugin.yml`, `shire-sell/plugin/src/main/java/com/shirecraft/sell/ShireSellPlugin.java`