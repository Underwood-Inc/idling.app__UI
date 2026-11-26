---
title: Root layout
description: HTML shell, PWA head tags, radio bootstrap, and site chrome providers
---

# Root layout

Top-level Next.js App Router layout for every page.

## Exports

| Export | Role |
|--------|------|
| `metadata` | `buildRootSiteMetadata()` plus `manifest: RADIO_PWA_MANIFEST_HREF` |
| `viewport` | `themeColor: RADIO_PWA_THEME_COLOR` |
| default `RootLayout` | `{ children: React.ReactNode }` |

## Document structure

- `<html lang="en" dir="ltr" suppressHydrationWarning>`
- `<head>`: manifest link, Apple/mobile PWA meta, `theme-color`
- `<body>`:
  1. `RadioPwaContextBootstrap` — client PWA/radio context wiring (no children)
  2. `SiteChromeProviders` — theme, nav loading, tooltips, etc.
  3. `SiteChromeShell` — navbar/footer frame around `children`

## Design choice

Metadata is **static** (`export const metadata`) rather than `generateMetadata` so production first byte is not blocked on locale chunk loading (see file comment).

## Global styles

Imports `globals.css` and `../css/mappy-cursors/cursors.css` at module scope.

## Edge cases

`suppressHydrationWarning` on `<html>` avoids theme/locale hydration mismatch noise from client providers.

---

**Sources:** `src/app/layout.tsx`, `@lib/radio-pwa/constants`