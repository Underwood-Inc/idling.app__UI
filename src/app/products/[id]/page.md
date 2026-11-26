---
title: Product marketing page
description: Static SSG product detail from marketing catalog
---

# Product page (`/products/[id]`)

## Static generation

- `generateStaticParams()` — one param per `listProductMarketingIds()` entry
- `generateMetadata` — `getProductMarketingProject(id)`; missing → `productNotFoundTitle`; else localized title + `productMarketingTagline`

## Default export

Async Server Component: loads project by `id`, `notFound()` if absent, renders `ProductMarketingDetail` in `PageContainer`.

## Data sources

In-memory marketing catalog (`productMarketing.ts`), not CMS DB. i18n via `getServerLL()` + `withShowcaseCopy`.

## Auth

None.

---

**Sources:** `src/app/products/[id]/page.tsx`, `src/app/components/marketing-dashboard/productMarketing.ts`