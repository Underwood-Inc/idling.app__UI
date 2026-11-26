---
title: DatabaseService (og-image)
description: Singleton persistence for OG generations
---

# DatabaseService (og-image)

## Pattern

`getInstance()` singleton; skips DB during production build phase (`NEXT_PHASE === phase-production-build`).

## Key types

`CreateOGGenerationParams`, `OGGenerationRecord`, `StoredGeneration` — map to `og_generations` (or equivalent) columns including SVG payload, fingerprint fields, and serialized `generation_options`.

## Responsibilities

Insert/list/update generation records, tie generations to users or guests, and surface metadata for history UI. Uses shared `@lib/db` sql client.

Consult `route.tsx` / `OGImageService` for which methods are called per request path.

---

**Sources:** `src/app/api/og-image/services/DatabaseService.ts`