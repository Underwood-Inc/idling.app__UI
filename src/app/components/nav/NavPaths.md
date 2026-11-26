---
title: NavPaths
description: Desktop header nav links and grouped dropdowns
---

# NavPaths

Client navigation from `HEADER_NAV_PATHS`, `NAV_GROUPS`, and `ROUTE_KEYS` (`@lib/routes`), with labels from `useIdlingLocale` and `idlingNavI18n` resolvers.

Renders flat `InstantLink` entries and expandable `NavGroup` sections. External routes show an inline SVG icon and localized external aria text. Active route styling uses `usePathname`. Wrapped in `Suspense` where search params are needed.

---

**Sources:** `src/app/components/nav/NavPaths.tsx`, `@lib/routes`