---
title: AboutSectionTitle
description: Section heading with catalog-mapped SiteIcon
---

# AboutSectionTitle

## Props

- `sectionId: AboutSectionIconId`
- `title: string`

## Behavior

Maps `sectionId` through `ABOUT_SECTION_ICON_IDS` in `siteIconCatalog` to render `SiteIcon` beside `<h3 className="about__section-title icon-inline">`.

---

**Sources:** `src/app/components/about/AboutSectionTitle.tsx`, `@molecules/lucide/siteIconCatalog`