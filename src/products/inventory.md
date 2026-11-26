---
title: 'Product inventory'
description: 'Living catalog of shipped and offered products with repo paths, hub URLs, and verification dates'
---

# Product inventory

**What this page is about:** anti-rot gate — every shipped or operated product gets a hub row and a `last_verified` date. The homepage carousel is a marketing subset, not the catalog boundary.

**Inventory rule:** new deployable ⇒ `src/products/showcase/<id>.md` when on the carousel, else `src/products/ensemble/<id>.md`, plus a row here.

## Web, desktop, and docs

| id | Repo path (`__CODE`) | Hub URL | last_verified | Sources cited |
| -- | -------------------- | ------- | ------------- | ------------- |
| idling-app | `idling.app__UI` | `/products/ensemble/idling-app` | 2026-11-26 | `package.json`, `docusaurus.config.js` |
| overlane | `scs-telemetry-overlay` | `/products/showcase/overlane` | 2026-11-26 | `tauri.conf.json`, `src/lib.rs`, `src/main.rs` |
| mappy | `apps/mappy` | `/products/showcase/mappy` | 2026-11-26 | `package.json`, `src-tauri/tauri.conf.json` |
| hello-desktop | `apps/hello-desktop` | `/products/ensemble/hello-desktop` | 2026-11-26 | `package.json`, `src-tauri/tauri.conf.json` |
| astral-hearth | `astral-hearth/typescript-version` | `/products/ensemble/astral-hearth` | 2026-11-26 | `package.json`, `src/server.ts` |
| astral-hearth-desktop | `apps/astral-hearth-desktop` | `/products/ensemble/astral-hearth-desktop` | 2026-11-26 | `package.json`, `src-tauri/tauri.conf.json` |
| mappy-maps-cdn | `mappy-public` + `apps/mappy/scripts` | `/products/ensemble/mappy-maps-cdn` | 2026-11-26 | `catalog.json`, `official-maps-r2.mjs` |
| mappy-internal | `mappy-internal` | `/products/ensemble/mappy-internal` | 2026-11-26 | `package.json`, `src/main.ts` |
| mc-display-editor | `mc-display-editor` | `/products/ensemble/mc-display-editor` | 2026-11-26 | `package.json`, `src/main.ts` |
| card-generator | `idling.app__UI` | `/products/showcase/card-generator` | 2026-11-26 | `card-generator/page.tsx`, `api/og-image` |
| svg-converter | `idling.app__UI` | `/products/showcase/svg-converter` | 2026-11-26 | `svg-converter/page.tsx`, `lib/services/svg-conversion/index.ts` |

## Showcase carousel (marketing subset)

| id | Repo path (`__CODE`) | Hub URL | last_verified | Sources cited |
| -- | -------------------- | ------- | ------------- | ------------- |
| overlane | `scs-telemetry-overlay` | `/products/showcase/overlane` | 2026-11-26 | `tauri.conf.json`, `src/lib.rs` |
| mappy | `apps/mappy` | `/products/showcase/mappy` | 2026-11-26 | `package.json`, `tauri.conf.json` |
| card-generator | `idling.app__UI` | `/products/showcase/card-generator` | 2026-11-26 | `card-generator/page.tsx` |
| svg-converter | `idling.app__UI` | `/products/showcase/svg-converter` | 2026-11-26 | `svg-converter/page.tsx` |
| compressy | `compressy` | `/products/showcase/compressy` | 2026-11-26 | `CompressyPlugin.java`, `plugin.yml` |
| offerings | `offerings` | `/products/showcase/offerings` | 2026-11-26 | `OfferingsPlugin.java`, `plugin.yml` |
| rituals | `rituals` | `/products/showcase/rituals` | 2026-11-26 | `RitualsPlugin.java`, `plugin.yml` |
| trials-of-the-wild | Modrinth `strixun-trials-of-the-wild` | `/products/showcase/trials-of-the-wild` | 2026-11-26 | `projectShowcaseProjects.ts` |
| alloys | `alloys` (datapack `s-alloys`) | `/products/showcase/alloys` | 2026-11-26 | `AlloysPlugin.java`, `plugin.yml` |
| tally | `tally` | `/products/showcase/tally` | 2026-11-26 | `TallyPlugin.java`, `plugin.yml` |
| shirecraft | live server | `/products/showcase/shirecraft` | 2026-11-26 | `projectShowcaseProjects.ts` |
| obs-animation-suite | `strixun-stream-suite` | `/products/showcase/obs-animation-suite` | 2026-11-26 | `package.json`, `src/App.svelte` |
| mods-hub | `strixun-stream-suite/apps/mods-hub` | `/products/showcase/mods-hub` | 2026-11-26 | `apps/mods-hub/package.json` |
| auth-service | `strixun-stream-suite/serverless/otp-auth-service` | `/products/showcase/auth-service` | 2026-11-26 | `worker.ts`, `package.json` |
| url-shortener | `strixun-stream-suite/serverless/url-shortener` | `/products/showcase/url-shortener` | 2026-11-26 | `worker.ts`, `package.json` |
| access-hub | `strixun-stream-suite/apps/access-hub` | `/products/showcase/access-hub` | 2026-11-26 | `access-hub/package.json`, `access-service/worker.ts` |
| shared-components | `strixun-stream-suite/packages/shared-components` | `/products/showcase/shared-components` | 2026-11-26 | `package.json` |
| api-framework | `strixun-stream-suite/packages/api-framework` | `/products/showcase/api-framework` | 2026-11-26 | `src/index.ts` |
| streamkit-api | `strixun-stream-suite/serverless/streamkit-api` | `/products/showcase/streamkit-api` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| search-query-parser | `strixun-stream-suite/packages/search-query-parser` | `/products/showcase/search-query-parser` | 2026-11-26 | `index.ts`, `package.json` |

Carousel ids must match `projectShowcaseProjects.ts` (see `projectShowcaseCatalog.ts`).

## Stream Suite — apps (beyond carousel-only rows)

| id | Repo path | Hub URL | last_verified | Sources cited |
| -- | --------- | ------- | ------------- | ------------- |
| streamkit | `strixun-stream-suite` + `serverless/streamkit-api` | `/products/ensemble/streamkit` | 2026-11-26 | `src/App.svelte`, `streamkit-api/worker.ts` |
| chat-hub | `strixun-stream-suite/apps/chat-hub` | `/products/ensemble/chat-hub` | 2026-11-26 | `chat-hub/package.json`, `chat-signaling/worker.ts` |
| flags-admin | `strixun-stream-suite/apps/flags-admin` | `/products/ensemble/flags-admin` | 2026-11-26 | `package.json`, `wrangler.toml` |
| design-idling-app | `strixun-stream-suite/packages/shared-components` | `/products/ensemble/design-idling-app` | 2026-11-26 | `wrangler.toml`, `.storybook/main.ts` |
| control-panel | `strixun-stream-suite/apps/control-panel` | `/products/ensemble/control-panel` | 2026-11-26 | `package.json`, `src/main.tsx` |
| dice-board-game | `strixun-stream-suite/apps/dice-board-game` | `/products/ensemble/dice-board-game` | 2026-11-26 | `package.json`, `index.ts`, `react/index.tsx` |

## Suite workers

Cross-link matrix: [Stream Suite](/products/stream-suite) § Operator / worker services.

## Extended ensemble (plugins, workers, ops)

| id | Repo path | Hub URL | last_verified | Sources cited |
| -- | --------- | ------- | ------------- | ------------- |
| access-api | `strixun-stream-suite/serverless/access-service` | `/products/ensemble/access-api` | 2026-11-26 | `access-service/worker.ts` |
| barrel-pc | `barrel-pc` | `/products/ensemble/barrel-pc` | 2026-11-26 | `BarrelPcPlugin.java`, `plugin.yml` |
| shire-sell | `shire-sell` | `/products/ensemble/shire-sell` | 2026-11-26 | `ShireSellPlugin.java`, `plugin.yml` |
| shire-menus | `shirecraft-menus` | `/products/ensemble/shire-menus` | 2026-11-26 | `ShireMenusPlugin.java`, `plugin.yml` |
| anchors | `anchors` | `/products/ensemble/anchors` | 2026-11-26 | `AnchorsPlugin.java`, `plugin.yml` |
| shirecraft-bukkit-utils | `shirecraft-bukkit-utils` | `/products/ensemble/shirecraft-bukkit-utils` | 2026-11-26 | `gradle.properties`, `AGENTS.md` |
| shirecraft-modpack | `shirecraft-modpack` | `/products/ensemble/shirecraft-modpack` | 2026-11-26 | `modrinth.index.json`, `README.md` |
| shirecraft-platform-core | `shirecraft-platform-core` | `/products/ensemble/shirecraft-platform-core` | 2026-11-26 | `build.gradle.kts`, `gradle.properties` |
| shirecraft-fabric-utils | `shirecraft-fabric-utils` | `/products/ensemble/shirecraft-fabric-utils` | 2026-11-26 | `fabric.mod.json`, `build.gradle.kts` |
| shirecraft-datapacks | `shirecraft-datapacks` | `/products/ensemble/shirecraft-datapacks` | 2026-11-26 | `infinitefishing-rods/pack.mcmeta`, `infinitefishing-rods/README.md` |
| just-fab-it | `just-fab-it` | `/products/ensemble/just-fab-it` | 2026-11-26 | `JfiPlugin.java`, `plugin.yml` |
| infinite-fishing-craft | `infinitefishing-craft` | `/products/ensemble/infinite-fishing-craft` | 2026-11-26 | `InfiniteFishingCraftPlugin.java`, `plugin.yml` |
| customer-api | `strixun-stream-suite/serverless/customer-api` | `/products/ensemble/customer-api` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| mods-api | `strixun-stream-suite/serverless/mods-api` | `/products/ensemble/mods-api` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| game-api | `strixun-stream-suite/serverless/game-api` | `/products/ensemble/game-api` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| music-api | `strixun-stream-suite/serverless/music-api` | `/products/ensemble/music-api` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| feature-flag-service | `strixun-stream-suite/serverless/feature-flag-service` | `/products/ensemble/feature-flag-service` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| chat-signaling | `strixun-stream-suite/serverless/chat-signaling` | `/products/ensemble/chat-signaling` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| suite-api | `strixun-stream-suite/serverless/suite-api` | `/products/ensemble/suite-api` | 2026-11-26 | `worker.ts`, `wrangler.toml` |
| discord-defect-bot | `apps/discord-defect-bot` | `/products/ensemble/discord-defect-bot` | 2026-11-26 | `package.json`, `src/index.ts` |
| cloudflare-edge | `cloudflare-edge` | `/products/ensemble/cloudflare-edge` | 2026-11-26 | `package.json`, `buckets/mappymaps/wrangler.jsonc` |

## Absent or not shipped locally

| id | Expected location | Status |
| -- | ------------------- | ------ |
| shire-daily | `shire-daily` | Gradle wrapper + `LICENSE` only — **no app source** — ensemble hub **not** created |

## Hub copy ban list

Jest, Yarn-as-default, Next 14, Node 18, Tailwind-as-primary-stack, Jekyll, `/docs/api` with `routeBasePath: '/'`.

## Co-located code-adjacent docs

**Hand-audit only** — sibling `.ts`/`.tsx`, `**Sources:**` footer ([Source audit](/guides/source-audit)). No bulk generators.

| Tree | Bootstrap stubs remaining (2026-11-26) |
| ---- | -------------------------------------- |
| `src/lib/**` | **0** — [Co-located docs lib](96fd5e04-eed8-47b0-bcee-e75871c4f14d) |
| `src/app/**` (incl. `api/`) | **0** — [Co-located docs src/app](3089c8dd-406e-4460-9600-cb41eee195a1) (+ earlier API pass) |
| `src/idling/**`, `src/guides/**` | Hand hub pages — [Deep idling guides hub](7776bd9a-b07e-4b5b-a1d6-fe0d4743db39) |
| Product ensemble | Living catalog — [Full ensemble product hubs](b21e160e-64aa-4af6-929d-b446a8dc878e), [Ensemble product docs gaps](92f5cb7d-4278-43c3-bb49-189f3a14dac2) |

Repo-wide `grep bootstrap-co-located-docs src` should hit only meta mentions (e.g. `guides/documentation-coverage.md`), not co-located neighbors.

## Related gates

| Gate | Location |
| ---- | -------- |
| Carousel ids | `projectShowcaseProjects.ts` / `projectShowcaseCatalog.ts` |
| API fiction ban | `src/idling/api-overview.md`, `src/app/api/index.md` |
| Contributing | `src/guides/contributing.md` requires source audit |