---
title: Compressy
description: Paper plugin — tiered block compression with policy gates and Crafter support
---

# Compressy

**What this is:** a **Paper** plugin (`api-version: 26.3`, `load: POSTWORLD`) that adds custom compress/decompress crafting in player grids and **Crafter** blocks, with per-block policies, LuckPerms gates, and optional AuraSkills / Offerings integrations.

## Runtime entry

- **Main class:** `com.compressy.plugin.CompressyPlugin` (`CompressyPlugin.java`).
- **Commands:** `/cblocks` (aliases `compressy`, `cb`) — subcommands `help`, `config`, `info`, `reload`, `prefab`, `admin` per `plugin.yml`.
- **Config files:** `config.yml` (defaults saved on first enable), `policies.yml` (global max tier and allow/deny lists). Max tier: `CompressyPlugin.maxCompressionTier()` reads `policyStore.document().globalMaxTier()` with fallback `CompressionTierLimits.DEFAULT_MAX_TIER`.

## Crafting behavior (source)

`CompressionCraftListener` implements compress/decompress outside vanilla recipe registration to avoid Paper craft-dupe issues (#1822):

- Cancels vanilla `CraftItemEvent` when the matrix is a Compressy operation.
- Performs a single atomic transaction (clear result → set matrix → give output).
- Works with `CompressionPolicyService` for allow/deny, tier caps, and integration gates.
- Separate listeners cover **player craft preview**, **Crafter** power craft, **Crafter preview**, and **compressed block placement** (`CompressedPlacementListener`).

`CompressionRecipeRegistry` registers dynamic recipes on enable; `BlockManifest` + `PolicyStore` load block metadata from disk.

## Permissions (`plugin.yml`)

| Node | Default | Meaning |
| ---- | ------- | ------- |
| `compressy.use` | true | Guidebook / block info |
| `compressy.compress` | true | Compress in crafting grid (policy may still deny) |
| `compressy.decompress` | true | Decompress |
| `compressy.bypass` | op | Skip lists/tier gates (not placement bypass) |
| `compressy.admin` | op | Policy GUI + reload |
| `compressy.block.*` / `compressy.tier.*` | true | Wildcard overrides |
| `compressy.prefab.*` | false | Prefab WIP — admin-only |

## Integrations (wired in `onEnable`)

- **LuckPerms** — `LuckPermsHook` logs availability at startup.
- **AuraSkills** — `AuraSkillsIntegration`; per-block gates when present.
- **Offerings** — soft dependency; catalog/market bridges via `CompressyIntegrations`.
- **Shirecraft runtime** — `ShirecraftRuntime.shared().install(...)` for shared craft session guards and identity; `CompressyIdentityPolicy`, `InfiniteFishingIdentityPolicy`, `BetterPetsIdentityPolicy` registered on enable.

## Operator troubleshooting

| Symptom | Check in code/config |
| ------- | -------------------- |
| Craft dupe or double output | `CompressionCraftListener` cancel path; Shirecraft `CraftSessionGuard` |
| Block not compressible | `policies.yml`, `compressy.block.*`, per-block nodes in policy GUI |
| Tier capped unexpectedly | `maxCompressionTier()` / `policyStore` |
| Command missing | Server log for `Command 'cblocks' missing from plugin.yml` |

## Ensemble links

Marketing card: `projectShowcaseProjects.ts` (`id: compressy`). Shared Bukkit patterns: [shirecraft-bukkit-utils](/products/ensemble/shirecraft-bukkit-utils).

---

**Sources (audited):** `compressy/plugin/src/main/resources/plugin.yml`, `compressy/plugin/src/main/java/com/compressy/plugin/CompressyPlugin.java`, `compressy/plugin/src/main/java/com/compressy/plugin/craft/CompressionCraftListener.java`