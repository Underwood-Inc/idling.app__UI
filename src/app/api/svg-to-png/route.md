---
title: /api/svg-to-png
description: Server-side SVG rasterization with validation
---

# /api/svg-to-png

Server rasterization for SVG → PNG (used when the browser tool or integrations need a validated conversion path). The public **SVG Converter** page at `/svg-converter` is primarily client-side; this route is the HTTP API.

## POST — convert

- **Content-Type:** `application/json` required; else `400` `INVALID_CONTENT_TYPE`.
- **Body (single):** `{ svgContent, options?, filename?, format?: 'json' | 'binary' }`
- **Body (batch):** `{ conversions: [...] }` when `conversions` key present → `handleBatchConversion`.
- Uses `createSvgToPngConverter` from `@lib/services/svg-conversion` with `enableSecurityValidation: true`, logging enabled.

## GET — health

Returns service metadata: `singleConversion`, `batchConversion`, `maxBatchSize: 10`, `maxSvgSize: '10MB'`, `securityValidation: true`, plus `converter.getStatus()`.

## Errors

JSON parse failures → `INVALID_JSON` 400. Missing `svgContent` → `MISSING_SVG_CONTENT` 400.

---

**Sources:** `src/app/api/svg-to-png/route.ts`, `@lib/services/svg-conversion`