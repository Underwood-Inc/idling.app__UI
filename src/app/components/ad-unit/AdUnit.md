---
title: AdUnit
description: Google AdSense ins push with layout presets
---

# AdUnit

Client component rendering a single AdSense `<ins class="adsbygoogle">`.

## Props (`AdUnitProps`)

| Prop | Default | Notes |
|------|---------|-------|
| `slot` | `3334459243` | Ad slot id |
| `format` | `auto` | Also `fluid`, rectangle variants |
| `fullWidthResponsive` | `true` | `data-full-width-responsive` |
| `className` | `''` | On wrapper |
| `testId` | `ad-unit` | Wrapper `data-testid` |
| `layout` | — | `in-article`, `in-feed-horizontal`, `in-feed-vertical` overrides format/keys |

Publisher: `AD_CLIENT = ca-pub-1546133996920392`.

## Side effects

`useEffect` runs once: if `window.adsbygoogle` exists and `data-ad-status` unset, `push({})`. Failures `console.debug` (ad blockers). Assumes script loaded in root layout.

## a11y

Wrapper `role="complementary"` `aria-label="Advertisement"`.

## Exports

Named `AdUnit` + default export.

---

**Sources:** `src/app/components/ad-unit/AdUnit.tsx`