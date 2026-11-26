---
title: ProductMarketingDetail
description: Full product detail marketing page for a showcase project
---

# ProductMarketingDetail

Client page body for `/products/[id]`. Props: `{ project: ProjectShowcaseProject }`.

## Layout

- `PageContent` + `FadeIn`, back link to `/`, hero visual from `homeHubContent` entry or Lucide icon fallback.
- Meta line: category, type, localized status (`productMarketingStatusLabel`).
- Tagline, CTA row from `listProductMarketingLinks`, optional tour href.
- Highlight bullets from `listProductMarketingHighlightsForProject`.
- “Built with” via `ProductTechStack` when labels exist for the project id.
- `ProductModrinthStats` when Modrinth metrics apply.

Shares `product-detail.css` with the stream suite product templates.

---

**Sources:** `src/app/components/marketing-dashboard/ProductMarketingDetail.tsx`, `src/app/components/marketing-dashboard/homeHubContent.ts`, `src/app/components/marketing-dashboard/productMarketing.ts`