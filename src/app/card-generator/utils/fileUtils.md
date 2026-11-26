---
title: fileUtils
description: SVG to PNG conversion and download helpers
---

# Card generator file utilities

Browser-side helpers for exporting generated SVG.

## Exports

| Function | Behavior |
|----------|----------|
| `convertSvgToPng(svgContent)` | Draws SVG onto transparent canvas via base64 data URL → `image/png` blob |
| `downloadFile(blob, filename)` | Temporary object URL + programmatic `<a download>` |
| `generateFilename(type, currentSeed, selectedRatio)` | `og-image-{seed}-{ratio}.png\|svg` with ISO timestamp fallback |

Used by `page.tsx` download actions after generation.

---

**Sources:** `src/app/card-generator/utils/fileUtils.ts`