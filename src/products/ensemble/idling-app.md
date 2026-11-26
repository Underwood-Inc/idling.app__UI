---
title: Idling.app
description: Next.js marketing site and Docusaurus documentation hub
---

# Idling.app

**What this is:** **`idling.app__UI`** — dual-surface product: **Next.js 16** consumer site at **https://idling.app** (radio, showcase, profile, onboarded API routes) and **Docusaurus 3** documentation at **https://docs.idling.app** served from the same repository (`src/` MDX + co-located route docs).

## Marketing app

- **Package:** `idling.app__UI/package.json` (`name`: `idling.app`, v0.519.1)
- **Build:** `next build --webpack`
- **Embedded tools:** [Card Generator](/products/showcase/card-generator), [SVG Converter](/products/showcase/svg-converter) (App Router pages in this repo)

## Documentation hub

- **Config:** `idling.app__UI/docusaurus.config.js` — `url: https://docs.idling.app`, product ensemble under `src/products/`
- **Product index:** [Product ensemble](/products/index)

## Failure modes

| Issue | Check |
| ----- | ----- |
| Broken doc link | Docusaurus `onBrokenLinks` warn + inventory `last_verified` |
| Showcase drift | `projectShowcaseProjects.ts` vs [inventory](/products/inventory) |

---

**Sources (audited):** `idling.app__UI/package.json`, `idling.app__UI/docusaurus.config.js`