---
title: useImageGeneration
description: Generate/regenerate OG images via /api/og-image
---

# useImageGeneration

Central generation orchestration: builds query params from form snapshot + `advancedOptions`, calls OG image API, updates quota + SVG state.

## Behavior

- Tracks `FormSnapshot` in a ref to detect unchanged re-submits → opens `RegenerationDialog` (`showRegenerationDialog`)
- Uses `noCacheFetch` for generation requests (`/api/og-image?...`)
- Handles quota headers/body (`remainingGenerations`), rate-limit messages via `formatRetryAfter`
- Supports `GenerationOverrides` for wizard one-shot submit
- `isGenerating`, `error`, `generationOptions` state exposed to page

Wired from `page.tsx` with many setter props from form/quota hooks.

---

**Sources:** `src/app/card-generator/hooks/useImageGeneration.ts`