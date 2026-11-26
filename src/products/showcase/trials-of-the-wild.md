---
title: Trials of the Wild
description: Hardcore exploration modpack — Rituals and Compressy featured integrations
---

# Trials of the Wild

**What this is:** **Minecraft modpack** distributed on Modrinth as **`strixun-trials-of-the-wild`** — hardcore survival with large exploration/magic/combat overhaul set (~250 mods per marketing card). No dedicated modpack source tree was present under `Documents/__CODE` at audit time; treat **Modrinth** as the shipped artifact source of truth.

## Distribution (audited marketing registry)

From `projectShowcaseProjects.ts` (`id: trials-of-the-wild`):

- **Modrinth:** `https://modrinth.com/modpack/strixun-trials-of-the-wild`
- **Mods Hub mirror:** `https://mods.idling.app/modpack-trials-of-the-wild`
- **modrinthId:** `strixun-trials-of-the-wild`

## Featured in-house integrations (separate repos)

| Integration | Repo audited locally |
| ----------- | -------------------- |
| Compressy block storage | `compressy/plugin/src/main/resources/plugin.yml` |
| Rituals totem magic | `rituals/plugin/src/main/resources/plugin.yml` |

Paper server deployments use plugin builds — modpack clients use Fabric/Forge artifacts from Modrinth.

## Failure modes

| Issue | Check |
| ----- | ----- |
| Version mismatch vs server | Modrinth pack version vs server plugin pins |
| Missing Compressy/Rituals on server | Server plugin folders — not modpack jar contents |

---

**Sources (audited):** `idling.app__UI/src/app/components/project-showcase/projectShowcaseProjects.ts`, Modrinth id `strixun-trials-of-the-wild`