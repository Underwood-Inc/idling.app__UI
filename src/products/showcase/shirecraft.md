---
title: Shirecraft
description: Whitelist Paper 26.3 survival server — custom plugins and datapacks
---

# Shirecraft

**What this is:** Operated **Minecraft Java** whitelist survival server (Paper **26.3** family) documented on Modrinth as server id **`shirecraft`**. Gameplay combines third-party plugins with in-house Paper plugins and datapacks maintained under `Documents/__CODE`.

## Live endpoint (marketing source)

- **Address:** `mc.idling.app:25567` (from `projectShowcaseProjects.ts` feature list)
- **Modrinth:** `https://modrinth.com/server/shirecraft`

## In-house stack (audited repos on this machine)

| Surface | Hub doc | Source entry |
| ------- | ------- | ------------ |
| Daily kits | [Offerings](/products/showcase/offerings) | `offerings/plugin/.../plugin.yml` |
| Advancements | [Tally](/products/showcase/tally) | `tally/plugin/.../plugin.yml` |
| Compression | [Compressy](/products/showcase/compressy) | `compressy/plugin/.../plugin.yml` |
| Economy sell | [ShireSell](/products/ensemble/shire-sell) | `shire-sell/plugin/.../plugin.yml` |
| Hub menus | [ShireMenus](/products/ensemble/shire-menus) | `shirecraft-menus/plugin/.../plugin.yml` |
| Shared Java library | [shirecraft-bukkit-utils](/products/ensemble/shirecraft-bukkit-utils) | `shirecraft-bukkit-utils/gradle.properties` |

Datapacks **Rituals**, **Alloys**, **Tally** ship companion Paper bridges — see各自的 showcase pages.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Plugin version skew | Server deploy JAR names vs `gradle.properties` `version` per plugin |
| Economy desync | Essentials worth + ShireSell reload; Offerings daily reset timezone |

This hub documents the **operated server product**, not a single git tree.

---

**Sources (audited):** `idling.app__UI/src/app/components/project-showcase/projectShowcaseProjects.ts` (id `shirecraft`), plugin.yml files cited in ensemble/showcase plugin pages above