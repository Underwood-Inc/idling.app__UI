---
title: OGImageService
description: Orchestrates authenticated OG SVG generation and quotas
---

# OGImageService

Central coordinator for `/api/og-image` generation.

## Dependencies

`QuoteService`, `AvatarService`, `SVGGenerator`, `DatabaseService` (singleton).

## `generateImage(request: NextRequest)`

Reads query params into `GenerationConfig`. Enforces subscription tier: Pro-only knobs (positioning, visual styling, watermark overrides) stripped or rejected for free users. Integrates `EnhancedQuotaService` / `checkGuestQuota` + `recordGuestUsage`; supports `dry-run` without persisting.

Returns `GenerationResponse`: `svg`, `seed`, `dimensions`, `aspectRatio`, `generationOptions`, quota remainder fields, optional `generationId`.

## Security notes (in-source)

Server-side validation prevents client tampering with Pro flags; unauthorized Pro params are logged.

---

**Sources:** `src/app/api/og-image/services/OGImageService.ts`