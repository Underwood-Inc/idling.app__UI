---
title: EcosystemDiagram
description: Tabbed Mermaid architecture diagrams for portfolio
---

# EcosystemDiagram

Client `Card` section with three Mermaid tabs (overview, dataflow, packages), loaded from CDN and themed for dark Gruvbox-style colors.

## Exports

- `EcosystemDiagram` — named export, no props

## Behavior

- Copy from `PORTFOLIO_EN` via `resolveCatalogFromLl` + `useIdlingLocale` (`ecosystem.title`, `subtitle`, tab labels, per-tab footer blurbs).
- Tab buttons use `ECOSYSTEM_TABS` icons/ids; `activeTab` state drives diagram source string.
- Injects `<div class="mermaid">` through `dangerouslySetInnerHTML`; loads `mermaid@10` script once, `initialize` + `run`, then `enhanceMermaidDiagrams` on the container ref.
- Re-runs Mermaid when tab changes after script load.

## Tabs

| Tab id | Content |
|--------|---------|
| `overview` | Web apps, Workers APIs, Minecraft, storage subgraph |
| `dataflow` | User personas → apps → APIs → data stores |
| `packages` | NPM package dependency graph |

---

**Sources:** `src/app/components/ecosystem-diagram/EcosystemDiagram.tsx`, `src/app/components/ecosystem-diagram/EcosystemDiagram.module.css`, `$i18n-source/portfolio.en`, `@molecules/lucide/siteIconCatalog`, `@lib/mermaid/mermaidViewer`