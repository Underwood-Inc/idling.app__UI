---
title: 'Contributing'
description: 'PR habits, documentation rules, and anti-rot ban list for hub copy'
---

# Contributing

**What this page is about:** how to change this repo without reintroducing stale stack fiction in the docs hub.

## Workflow

1. Branch from `main` with a readable name (`feat/…`, `fix/…`, `docs/…`).
2. Use **pnpm** for all installs and scripts.
3. Run `pnpm validate` and `pnpm test` before opening a PR.
4. For user-visible product marketing, update **both** `projectShowcaseProjects.ts` and `src/products/showcase/<id>.md` in the same change.

## Documentation rules

| Rule | Detail |
| ---- | ------ |
| Source audit | [**Required**](/guides/source-audit) — read implementation files; cite paths in a **Sources** footer. READMEs are not sufficient alone. |
| Hub vs code-adjacent | Curated truth lives under `guides/`, `philosophy/`, `products/`, `idling/` |
| Co-located `.md` | Replace bootstrap stubs with audited content when you touch that module |
| Protected home | `src/index.md` and `src/lib/utils/index.md` — enrich, do not overwrite with automation |
| Truth source | `route.ts`, `plugin.yml`, OpenAPI beat prose when they disagree |

## Hub copy ban list

Do **not** write these as facts on hub pages:

- Jest as the test runner (use **Vitest**)
- Yarn as default package manager (use **pnpm**)
- Next.js 14 / Node 18 as current targets
- Tailwind as the primary styling stack for this app
- Jekyll or `community/` doc hosting
- `/docs/api` paths (Docusaurus `routeBasePath` is `/`)

## CLAD and tests

Follow [CLAD](/philosophy/clad) advisory guidance. Prefer trace-tagged Vitest tests per [Traceability](/philosophy/traceability).

## Related

- [Documentation coverage](/guides/documentation-coverage)
- [Living product inventory](/products/inventory)