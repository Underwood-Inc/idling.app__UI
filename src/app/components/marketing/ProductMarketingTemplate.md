---
title: ProductMarketingTemplate
description: Static marketing page layout for product landings without embedded demos
---

# ProductMarketingTemplate

Reusable server-friendly layout for standalone product marketing pages. Deliberately avoids interactive demos; consumers pass structured copy and optional slots.

## Exported types

| Type | Role |
|------|------|
| `ProductFeature` | Icon, title, description, optional `highlights[]` bullet list |
| `ProductLink` | CTA label, URL, variant (`primary` \| `secondary` \| `github` \| `external`), optional icon |
| `ProductMarketingProps` | Full page payload (hero, features, links, optional tech stack, stats, testimonial, `children`) |

## Sections (render order)

1. **Hero** — optional emoji/icon, title, tagline, description, CTA row (all links open in a new tab with `noopener noreferrer`).
2. **Stats** — optional metric cards when `stats` is non-empty.
3. **Features** — grid of feature cards with optional highlight bullets.
4. **Tech stack** — when `techStack` is set, renders `ProductTechStack` via `productTechStackItems`.
5. **Testimonial** — blockquote plus author/role.
6. **Custom** — arbitrary `children` in `product-marketing__custom`.

Styles: `ProductMarketingTemplate.css` plus shared `product-detail.css` from the stream suite folder.

---

**Sources:** `src/app/components/marketing/ProductMarketingTemplate.tsx`, `src/app/strixun-stream-suite/ProductTechStack.tsx`