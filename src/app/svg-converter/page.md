---
title: SVG Converter tool page
description: Tools route for client-side SVG to PNG conversion
---

# SVG Converter (`svg-converter/page.tsx`)

Client page (`'use client'`) for the SVG→PNG utility under Tools.

## State

- `ConversionResult` type (exported): `id`, `filename`, sizes, `dimensions`, `conversionTime`, `blob`, `timestamp`.
- `currentResult`, `conversions[]`, `isConverting`, error string.

## Layout

`ToolsCopyProvider` + `useToolsCopy()` for `svgConverter` i18n strings. Shell: `PageContainer`, `PageAside`, `PageContent`, `FadeIn`, `page.module.css`.

## Children

- `SvgConverterInterface` — input + conversion.
- `ConversionDisplay` — active result preview/download.
- `ConversionHistory` — session history list.

Requires session hook for gated copy in places (see source).

---

**Sources:** `src/app/svg-converter/page.tsx`, `src/app/tools/ToolsCopyContext.tsx`