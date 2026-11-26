---
title: 'SVG to PNG converter'
description: 'Browser tool at /svg-converter and POST /api/svg-to-png'
---

# SVG to PNG converter

**Route:** `/svg-converter` (`src/app/svg-converter/page.tsx`).

**In plain terms:** users paste or upload SVG; conversion runs **in the browser** via `@lib/services/svg-conversion`. The same service backs **`POST /api/svg-to-png`** for JSON/binary integrations.

## Page layout

Client page wrapped in `ToolsCopyProvider` (i18n tool strings from tools catalog).

| Component | Role |
| --------- | ---- |
| `SvgConverterInterface` | File upload (`.svg` only, max **10MB**) or textarea paste; scale/quality/background options |
| `ConversionDisplay` | Current result preview + download |
| `ConversionHistory` | Last **10** conversions in session state (not persisted server-side) |

`SvgConverterInterface` calls `createSvgToPngConverter({ enableSecurityValidation: true })` and `convertWithProgress` for UI progress steps — **no** `fetch('/api/svg-to-png')` on the default path.

## HTTP API

Co-located reference: [svg-to-png route doc](/app/api/svg-to-png/route).

### `GET /api/svg-to-png`

Health/capabilities JSON: `maxBatchSize: 10`, `maxSvgSize: '10MB'`, `securityValidation: true`, plus `converter.getStatus()`.

### `POST /api/svg-to-png`

- Requires `Content-Type: application/json`.
- **Single body:** `{ svgContent, options?, filename?, format?: 'json' | 'binary' }`
  - Validates with `converter.validateSvg`; failures → `400` `INVALID_SVG` + `safetyIssues`.
  - `format=binary` → `image/png` with optional `Content-Disposition`.
  - Default JSON → base64 `pngData` + dimensions/metadata.
- **Batch body:** top-level `conversions` array (max **10** entries) → parallel `convertBatch`; summary counts in response.
- Default converter options in route: `quality: 1`, `scale: 1`, `timeout: 30000`, security validation on.

### Error codes (representative)

| Code | HTTP | Meaning |
| ---- | ---- | ------- |
| `INVALID_CONTENT_TYPE` | 400 | Not JSON |
| `MISSING_SVG_CONTENT` | 400 | Empty `svgContent` |
| `BATCH_SIZE_EXCEEDED` | 400 | More than 10 conversions |
| `CONVERSION_FAILED` | 500 | Rasterization error |

## Security

SVG passes security validation in both client and API paths (`enableSecurityValidation: true`). Do not disable for operator convenience — malicious SVG can embed scripts or external fetches.

## Related

- [API overview](/idling/api-overview)
- Hub OpenAPI: `/api/` (tag **Images** / conversion)
- [Showcase product page](/products/showcase/svg-converter)

---

**Sources:** `src/app/svg-converter/page.tsx`, `src/app/svg-converter/components/SvgConverterInterface.tsx`, `src/app/api/svg-to-png/route.ts`, `@lib/services/svg-conversion`