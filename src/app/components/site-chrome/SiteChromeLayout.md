---
title: SiteChromeLayout
description: Full browser shell with providers and global chrome
---

# SiteChromeLayout

Wraps page content in `SiteChromeProviders` and standard site chrome: navigation loading bar, sticky `Header`, `MessageTickerWithInterval`, `main`, `Footer`, `OverlayRendererWrapper`, `PWAInstallPrompt`.

Loads `globals.css` and Mappy cursor styles. Marked with `data-site-chrome` / `data-visualizer-layout` for visualizer layout coordination. Not used for installed radio PWA entry.

---

**Sources:** `src/app/components/site-chrome/SiteChromeLayout.tsx`, `src/app/components/site-chrome/SiteChromeProviders.tsx`