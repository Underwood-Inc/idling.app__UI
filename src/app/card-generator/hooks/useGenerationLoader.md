---
title: useGenerationLoader
description: Load existing generation by id into form and preview
---

# useGenerationLoader

Hydrates UI from a saved generation id (deep links / welcome flow).

## Flow

1. Clears SVG, form, ratio, cached options
2. `GET /api/og-image/{id}?format=json` with long-cache headers (immutable 30d)
3. Applies `aspectRatio`, seeds, quotes, dimensions, `generationOptions` into parent setters
4. Optional `onGenerationLoaded` callback

Exposes `loadGeneration(id)`, `isLoading`, `loadedOptions`.

---

**Sources:** `src/app/card-generator/hooks/useGenerationLoader.ts`