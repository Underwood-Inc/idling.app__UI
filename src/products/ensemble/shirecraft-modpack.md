---
title: Shirecraft Modpack
description: Official Fabric client modpack publish kit for mc.idling.app — Modrinth manifest and overrides
---

# Shirecraft Modpack

**What this is:** a **Modrinth modpack publish kit** (not a Gradle build) — `modrinth.index.json`, bundled `shirecraft-1.0.0.mrpack`, `overrides/`, and branding assets for the official **Shirecraft** client aligned with `mc.idling.app`.

## Publish entry (`README.md`)

| Artifact | Role |
| -------- | ---- |
| `modrinth.index.json` | Modrinth pack manifest — mod file list, hashes, CDN downloads |
| `shirecraft-1.0.0.mrpack` | Upload-ready archive for Modrinth version **1.0.0** |
| `overrides/` | Client config defaults not hosted on Modrinth CDN |
| `icon.png` | Modrinth project icon (cottage emblem) |

## Manifest (`modrinth.index.json`)

- **Name:** Shirecraft
- **formatVersion:** 1
- **versionId:** 1.0.0
- **dependencies:** Minecraft **26.2**, **fabric-loader** `0.19.3`
- **summary:** Official client modpack for the Shirecraft server (`mc.idling.app`)
- **files[]:** Client-required Fabric mods (Modrinth CDN URLs); each entry sets `env.client: required`, `env.server: unsupported`

## Operator flow

1. Modrinth project: **Modpack**, **Fabric**, game **26.2**, environment **client**.
2. Upload `icon.png`, then version **1.0.0** with `shirecraft-1.0.0.mrpack`.
3. After Prism instance changes, regenerate per repo `AUDIT.md` § Rebuild (README).

## Attribution

README notes lineage from **Fabulously Optimized** mod list — independent Shirecraft distribution; no FO branding in Modrinth copy.

## Ensemble links

Live server card: [Showcase](/products/showcase/shirecraft). Trials client pack: [Trials of the Wild](/products/showcase/trials-of-the-wild).

---

**Sources (audited):** `shirecraft-modpack/README.md`, `shirecraft-modpack/modrinth.index.json`