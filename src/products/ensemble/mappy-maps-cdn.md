---
title: Mappy Maps CDN
description: Static official map pack catalog and tile assets for mappy downloads
---

# Mappy Maps CDN

**What this is:** Published **static asset tree** `mappy-public/` — official map pack catalog JSON, preview imagery, and hosted map tiles consumed by [mappy](/products/showcase/mappy) when users install Official Map Packs. Not a runnable Worker in this clone; distribution is file CDN / GitHub release URLs referenced from the catalog.

## Catalog entry

- **Manifest:** `mappy-public/official-maps/catalog.json` — `schemaVersion`, per-map `id`, `packUrl`, `version`, attribution
- **Example packs:** `skyrim`, `crimson-desert` with `packUrl` under `github.com/Underwood-Inc/mappy/releases/download/official-maps-index/`
- **World manifest:** `mappy-public/official-maps/worlds.manifest.json`

## Tile assets

- **Path pattern:** `mappy-public/map-tiles/games/<game>/<world>/...` (JPEG pyramid tiles for shipped demos)

## Failure modes

| Issue | Check |
| ----- | ----- |
| Pack download 404 | `packUrl` version vs GitHub release tag |
| Wrong world loaded | `dataWorldSlug` / `gameSlug` in catalog vs app import |
| Attribution missing | `attribution` field required for third-party game content |

Operator updates: edit catalog + upload tiles alongside mappy release pipeline in `apps/mappy` scripts.

## Large packs (R2)

When a pack exceeds GitHub Release’s **2 GiB** cap, CI uploads to **Cloudflare R2** (default bucket `mappymaps`, public base `MAPPY_OFFICIAL_R2_PUBLIC_BASE`). Implementation: `apps/mappy/scripts/official-maps-r2.mjs` + S3 upload helper; workflow secrets in `mappy-public/.github/workflows/publish-official-maps.yml`. Catalog `packUrl` may point at GitHub or the R2 public URL depending on pack size. Operator Wrangler notes: [Cloudflare Edge](/products/ensemble/cloudflare-edge).

---

**Sources (audited):** `mappy-public/official-maps/catalog.json`, `mappy-public/official-maps/worlds.manifest.json`, `apps/mappy/scripts/official-maps-r2.mjs`, `mappy-public/.github/workflows/publish-official-maps.yml`