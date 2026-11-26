---
title: MarketingDashboard
description: Home page shell wrapping the product explorer
---

# MarketingDashboard

Named export that renders the **home marketing column** on `/`. It is a thin layout shell only: no locale hooks or data fetching here — all copy and chapter assembly live in child components.

## Exports

- `MarketingDashboard` — no props

## Render

1. Root `div` with `marketing-dashboard.module.css` → `styles.dash`
2. `data-home-page` and `data-testid="marketing-dashboard"` for E2E and analytics hooks
3. Single child: `MarketingProductExplorer` (masthead + `HomeProductHub` product lineup)

## Composition chain

`HomeLanding` (server, `home__marketing` wrapper) → `MarketingDashboard` → `MarketingProductExplorer` → `HomeProductHub` / tiles. Product ids, links, and Modrinth stats are resolved in sibling modules (`productMarketing.ts`, `homeHubCatalog.ts`).

## Related routes

- Product detail pages use `ProductMarketingDetail`, not this shell.
- CSS for tiles and masthead is shared via `marketing-dashboard.module.css` and imported by explorer/hub children.

---

**Sources:** `src/app/components/marketing-dashboard/MarketingDashboard.tsx`, `src/app/components/marketing-dashboard/MarketingProductExplorer.tsx`, `src/app/components/home-landing/HomeLanding.tsx`, `src/app/components/marketing-dashboard/marketing-dashboard.module.css`