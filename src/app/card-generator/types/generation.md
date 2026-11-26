---
title: Card generator generation types
description: Shared interfaces for OG image generation options and quota
---

# Generation types

Type-only module for the card generator feature.

## Key interfaces

| Type | Purpose |
|------|---------|
| `AspectRatioOption` | Catalog row: key, name, description, dimensions |
| `GenerationOptions` | Free + Pro API payload (seeds, layout, watermark controls) |
| `GenerationResponse` | API success: id, svg, seed, dimensions, `remainingGenerations` |
| `GenerationFormState` | stringly-typed form fields synced with hooks/page |
| `QuotaState` | remaining/limit/initialized/exceeded/resetDate |

Pro-only fields include avatar placement, typography, border/glass, pattern seed, watermark position/rotation.

---

**Sources:** `src/app/card-generator/types/generation.ts`