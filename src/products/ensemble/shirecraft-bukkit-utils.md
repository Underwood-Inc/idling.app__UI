---
title: Shirecraft Bukkit Utils
description: Shared shaded Java library for Shirecraft Paper plugins — runtime, catalog identity, GUIs
---

# Shirecraft Bukkit Utils

**What this is:** Gradle library **`com.shirecraft:shirecraft-bukkit-utils`** (v**1.5.37** in `gradle.properties`) — embedded into Paper plugins via `includeBuild` + shaded JAR, not a standalone plugin. Provides `ShirecraftRuntime`, catalog identity pipeline, datapack installers, GUI/search molecules, and stamp/craft recipes shared across Shirecraft plugins.

## Build entry

- **Coordinates:** `shirecraft-bukkit-utils/gradle.properties` — `group=com.shirecraft`, `minecraft_version=26.3`, Paper API `26.3.build.+`
- **Charter / package map:** `shirecraft-bukkit-utils/AGENTS.md` — CLAD tiers from Atoms through App (`ShirecraftRuntime`, `CatalogIdentityPipeline`, `FilterEntrySyntax`, `DatapackBridge`, …)

## Composition root

- **`com.shirecraft.bukkit.runtime.ShirecraftRuntime`** — installs into consumers such as `TallyPlugin`, `CompressyPlugin`, `BarrelPcPlugin`, `ShireSellPlugin` on enable.
- **Catalog identity:** `CatalogIdentityPipeline`, `MarketIdentityService` (ShireSell); server extensions via `IdentityExtensionsConfig`.

## Consumer plugins (local repos)

Compressy, Offerings, ShireSell, ShireMenus, Barrel PC, Tally, Anchors — each shades this JAR rather than copying helpers.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Identity mismatch across plugins | Bump utils `version` and rebuild all consumers after API change |
| Duplicate merge helpers in plugin | Move generic util to `com.shirecraft.bukkit.util` per AGENTS.md |

Pipeline doc in repo: `shirecraft-bukkit-utils/docs/catalog-identity-pipeline.md`.

---

**Sources (audited):** `shirecraft-bukkit-utils/gradle.properties`, `shirecraft-bukkit-utils/AGENTS.md`