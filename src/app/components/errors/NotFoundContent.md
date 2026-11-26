---
title: NotFoundContent
description: Localized 404 page body with home link
---

# NotFoundContent

Client centered 404 layout using `errors.notFound` catalog strings.

## Exports

- `NotFoundContent` — named export, no props

## Render

- Gradient-styled `{copy.code}` (e.g. 404), title with `SiteIcon` `wand`, message paragraph, `Link` to `/` styled as primary CTA (`copy.returnHome`).
- Strings from `resolveCatalogFromLl(ERRORS_EN, ll.errors)`.

---

**Sources:** `src/app/components/errors/NotFoundContent.tsx`, `$i18n-source/errors.en`, `src/app/components/locale/IdlingLocaleProvider.tsx`