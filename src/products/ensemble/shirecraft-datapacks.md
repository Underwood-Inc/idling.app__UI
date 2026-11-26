---
title: Shirecraft Datapacks
description: Server datapack bundle repo — survival rod recipes aligned with InfiniteFishing PDC identity
---

# Shirecraft Datapacks

**What this is:** a **datapack-only** repo (no Gradle root) shipping folder packs for the Shirecraft Paper server. Current pack: **`infinitefishing-rods`** — survival crafting recipes for InfiniteFishing tiered rods without plugin code changes.

## Pack entry (`infinitefishing-rods/pack.mcmeta`)

- **description:** Shirecraft — survival crafting recipes for InfiniteFishing rods
- **pack_format:** min/max `[121, 0]` (data version **1.21** line in `pack.mcmeta`)

## Content layout

| Path | Role |
| ---- | ---- |
| `data/shirecraft/recipe/rod_*.json` | Shaped recipes output rods matching `/infinitefishing giverod` tags |
| `data/shirecraft/advancement/recipes/` | Tier progression — unlock next rod recipe in book |
| `data/shirecraft/advancement/recipes/root.json` | Recipe book root |

Rod IDs align with `plugins/InfiniteFishing/rods.yml` via Paper PDC `infinitefishing:customitem` (`PublicBukkitValues` in recipe results).

## Progression (from `infinitefishing-rods/README.md`)

`rod_beginner` → `rod_silver` → `rod_golden` → `rod_star` → `rod_bone` → `rod_magical` → `rod_master` — each advancement grants the next tier.

## Install (operator)

1. Copy `infinitefishing-rods/` into server `datapacks/`.
2. `/reload` or restart; confirm with `datapack list`.
3. One-time: `advancement grant @a only shirecraft:recipes/root` for existing players.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Rod not recognized when fishing | Recipe output PDC + `custom_model_data` vs `rods.yml` |
| Recipe book stuck | Advancement chain under `data/shirecraft/advancement/recipes/` |

## Ensemble links

Plugin companion: [Infinite Fishing Craft](/products/ensemble/infinite-fishing-craft). Bukkit-side catalog patterns: [shirecraft-bukkit-utils](/products/ensemble/shirecraft-bukkit-utils).

---

**Sources (audited):** `shirecraft-datapacks/infinitefishing-rods/pack.mcmeta`, `shirecraft-datapacks/infinitefishing-rods/README.md`, `shirecraft-datapacks/infinitefishing-rods/data/shirecraft/recipe/rod_beginner.json`