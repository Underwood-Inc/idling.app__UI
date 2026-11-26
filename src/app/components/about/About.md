---
title: About
description: Portfolio about hero and section list from i18n catalog
---

# About

`'use client'` marketing block for portfolio/about surface.

## Copy source

`PORTFOLIO_EN` resolved through `useIdlingLocale` → `portfolio.about` strings.

## Structure

- Hero: eyebrow, title, tagline, intro with `LinkTooltip` + `InstantLink` to `NAV_PATHS.ROOT` (`ABOUT_PAGE_SELECTORS.ROOT_LINK`)
- Stats list from `about.highlights`
- Sections map: `AboutSectionTitle` (icon from section id), bullet highlights, optional `AboutExternalLink` rows

## Dependencies

No fetching; pure presentation + i18n.

---

**Sources:** `src/app/components/about/About.tsx`, `$i18n-source/portfolio.en`