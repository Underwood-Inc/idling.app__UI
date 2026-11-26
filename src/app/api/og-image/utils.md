---
title: og-image utils
description: SVG text and deterministic random helpers
---

# og-image utils

Pure functions used by `SVGGenerator` and pattern generators.

## Exports

| Function | Role |
| -------- | ---- |
| `wrapTextForSVG(text, maxCharsPerLine)` | Word-wrap to string lines for `<text>` stacks |
| `escapeXml(text)` | Entity-escape user/supplier strings |
| `seededRandom(seed)` | Deterministic `() => number` from string seed |
| `generateDailyAvatarSeed()` | Time-bucketed seed (`daily-og-YYYY-MM-DD-hour-quarter`) for rotating avatars |

No I/O; safe on server during SVG assembly.

---

**Sources:** `src/app/api/og-image/utils.ts`