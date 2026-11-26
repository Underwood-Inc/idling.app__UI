---
title: Strixun Stream Suite landing
description: Marketing hub for Strixun suite products with localized copy
---

# Strixun Stream Suite (`page.tsx`)

Server default export renders `StrixunSuitePageClient`.

## Route

`/strixun-stream-suite` — product showcase grid for the Strixun / Idling streaming ecosystem.

## Client behavior

- Resolves copy via `resolveSuiteLandingCopy` and per-product `resolveStrixunSuiteProduct` from `strixunSuiteProducts.ts` + locale `ll`.
- Hero with mascot GIF, feature list, and linked product cards (`FadeIn`, `page.module.css`).
- Each product card links to nested routes (`access-hub`, `auth-service`, etc.).

Detail pages use `SuiteDetailPageClient` with `SUITE_DETAILS_EN` i18n catalog.

---

**Sources:** `src/app/strixun-stream-suite/page.tsx`, `src/app/strixun-stream-suite/StrixunSuitePageClient.tsx`, `src/app/strixun-stream-suite/strixunSuiteProducts.ts`