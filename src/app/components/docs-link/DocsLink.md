---
title: DocsLink
description: Footer link to docs.idling.app with tooltip
---

# DocsLink

Client anchor to `https://docs.idling.app` inside `LinkTooltip` (`isInsideParagraph`).

## Exports

- `DocsLink` — named export, no props

## Render

- Link text from `ll.footer.docs()`.
- `data-testid`: `DOCS_LINK_SELECTORS.LINK`; opens in new tab (`target="_blank"`).

---

**Sources:** `src/app/components/docs-link/DocsLink.tsx`, `src/app/components/locale/IdlingLocaleProvider.tsx`, `@lib/test-selectors/components/docs-link.selectors`