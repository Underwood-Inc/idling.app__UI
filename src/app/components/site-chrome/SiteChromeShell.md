---
title: SiteChromeShell
description: Chrome markup without the provider stack
---

# SiteChromeShell

Same DOM regions as `SiteChromeLayout` (loading bar, header, ticker, main, footer, overlay renderer, PWA prompt) but **without** `SiteChromeProviders`. Used when providers are mounted higher in the tree (e.g. split layouts).

---

**Sources:** `src/app/components/site-chrome/SiteChromeShell.tsx`