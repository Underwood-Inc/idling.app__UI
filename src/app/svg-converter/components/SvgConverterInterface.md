---
title: SvgConverterInterface
description: File upload and paste UI for SVG to PNG conversion
---

# SvgConverterInterface

## Props

Callbacks: `onConversionStart`, `onConversionComplete(result)`, `onConversionEnd`, `onError(message)`; flags `isConverting`, `error`.

## Input modes

`inputMethod`: `'file'` (max 10MB `.svg`) or `'text'` textarea. Options via `SvgToPngConversionOptions`: `quality`, `scale`, `backgroundColor` (default transparent).

## Conversion

Uses `createSvgToPngConverter` from `@lib/services/svg-conversion` with progress callbacks updating `conversionProgress` / `progressStep` UI.

Emits parent `ConversionResult` including output blob and timing.

---

**Sources:** `src/app/svg-converter/components/SvgConverterInterface.tsx`, `@lib/services/svg-conversion`, `src/app/svg-converter/page.tsx`