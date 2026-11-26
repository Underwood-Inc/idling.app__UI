---
title: HomeLanding
description: Server wrapper for the main home marketing experience
---

# HomeLanding

Async-safe server component that is the **only** home route body re-exported from the app page. No data fetching or metadata here.

## Exports

- `HomeLanding` — no props

## Render

- Outer `div` with `home__marketing` from `src/app/page.module.css` (spacing and full-width marketing column).
- Child: `MarketingDashboard` → `MarketingProductExplorer` → hub chapters and tiles.

## Behavior

Keeps marketing markup out of `page.tsx` so the home segment can evolve independently. Radio dock, ticker, and footer chrome still come from the root layout / site chrome; this component is **marketing-only** content in the main column.

## Testing

Downstream `data-testid="marketing-dashboard"` lives on `MarketingDashboard`, not on `HomeLanding`.

---

**Sources:** `src/app/components/home-landing/HomeLanding.tsx`, `src/app/page.module.css`, `src/app/components/marketing-dashboard/MarketingDashboard.tsx`