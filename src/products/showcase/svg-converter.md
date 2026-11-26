---
title: SVG Converter
description: Browser-side SVG→PNG conversion tool on idling.app
---

# SVG Converter

**What this is:** **Next.js App Router** tool at `/svg-converter` in **`idling.app__UI`** — upload or paste SVG, configure scale/quality/background, convert to PNG entirely in the browser with session-aware history UI.

## UI entry

- **Page:** `idling.app__UI/src/app/svg-converter/page.tsx` — `ConversionDisplay`, `ConversionHistory`, `SvgConverterInterface`; copy via `ToolsCopyContext`.
- **Interface:** `src/app/svg-converter/components/SvgConverterInterface.tsx` — file/text input, progress state, calls converter service.

## Conversion service

- **Library:** `src/lib/services/svg-conversion/index.ts` — `createSvgToPngConverter`, `SvgToPngConversionOptions` (quality, scale, backgroundColor).

## Failure modes

| Issue | Check |
| ----- | ----- |
| Huge SVG hangs | Canvas scale limits in converter config |
| Transparent background wrong | `backgroundColor: 'transparent'` vs opaque hex in options |
| CORS on external SVG refs | Browser taints canvas — use inline SVG text mode |

No server round-trip for conversion — unlike [Card Generator](/products/showcase/card-generator) `/api/og-image`.

---

**Sources (audited):** `idling.app__UI/src/app/svg-converter/page.tsx`, `idling.app__UI/src/app/svg-converter/components/SvgConverterInterface.tsx`, `idling.app__UI/src/lib/services/svg-conversion/index.ts`