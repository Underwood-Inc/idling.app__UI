---
title: MarketingProductExplorer
description: Localized home masthead plus product hub
---

# MarketingProductExplorer

Client component that composes the home “dashboard” masthead and the product lineup.

## Behavior

- Reads copy from `useIdlingLocale()` → `ll.home.masthead` (title, line, “see lineup” CTA linking to `#products`).
- Renders `HomeProductHub` below the masthead.
- Uses CSS module classes under `styles.dash__*`.

---

**Sources:** `src/app/components/marketing-dashboard/MarketingProductExplorer.tsx`, `src/app/components/locale/IdlingLocaleProvider.tsx`