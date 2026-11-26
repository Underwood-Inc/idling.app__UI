---
title: contrastSafe
description: WCAG contrast picking for theme CSS variables
---

# contrastSafe

Picks foreground colors against a background using relative luminance (target ratio **4.5**).

## Exports

- **`relativeLuminance`**, contrast ratio helpers
- **`CONTRAST_SAFE_FOREGROUND_CANDIDATES`** — white/off-white/black palette
- **`ContrastSafeCssVars`** — `--contrast-safe-bg`, `--contrast-safe-fg`, hover/border variants
- Functions to build var maps from hex/RGB inputs (see source)

Used by themed UI where user or station colors need readable text automatically.

---

**Sources:** `src/lib/color/contrastSafe.ts`