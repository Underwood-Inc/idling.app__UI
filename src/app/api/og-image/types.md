---
title: og-image types
description: Shared TypeScript contracts for OG image generation
---

# og-image types

Type-only module for the card-generator OG pipeline (`src/app/api/og-image/`).

## Core data

- `QuoteData` — `text`, optional `author`
- `QuoteAPIConfig` — external quote source descriptor (`url`, `weight`, `transform`)
- `WatermarkConfig` — placement, opacity, pattern modes for SVG overlay
- `AspectRatioConfig` — canvas size plus default avatar/text anchors

## Generation

- `GenerateImageParams` — query/body overrides (seeds, quote, aspect ratio, layout knobs)
- `AvatarPositioning`, `TextPositioning` — resolved layout numbers
- `BackgroundPatternResult` — `{ patterns, predominantColor }` SVG fragment metadata
- `StoredGeneration`, `GenerationMetadata` — persistence shapes for `DatabaseService`

Import from `../types` inside services; keep new interfaces here rather than inline in routes.

---

**Sources:** `src/app/api/og-image/types.ts`