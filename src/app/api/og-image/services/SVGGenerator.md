---
title: SVGGenerator
description: Composes final OG card SVG
---

# SVGGenerator

Uses `BasePatternGenerator` for background, `escapeXml` / `wrapTextForSVG` for text.

## `generateSVG(...)`

Inputs: avatar SVG string, `QuoteData`, pattern seed, `AspectRatioConfig`, layout structs, optional Pro overrides (`allCustomOptions`), default watermark for free tier.

Output: `{ svg, actualValues }` where `actualValues` records resolved numeric styling used (for persistence and client echo).

Layers: procedural background, bordered frame, avatar placement, wrapped quote/author text, optional watermark/glass effects per config.

---

**Sources:** `src/app/api/og-image/services/SVGGenerator.ts`