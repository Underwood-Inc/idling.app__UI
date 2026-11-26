---
title: 'Development tooling'
description: 'pnpm, Docker, Next 16, and day-to-day commands for idling.app__UI'
sidebar_position: 2
---

# Development tooling

**What this page is about:** how engineers actually run and ship this app — not generic “install Yarn” copy.

## Prerequisites

| Tool | Version |
| ---- | ------- |
| Node.js | **≥ 22** (`package.json` `engineStrict`) |
| pnpm | **≥ 11** |
| Docker | Recommended for `pnpm dev:docker:win` |
| Git | Husky hooks via `pnpm prepare` |

Windows first-time setup: `pnpm setup:windows`, then `pnpm install`.

## Everyday commands

```bash
pnpm dev                 # Next.js dev server (:3000) — use Docker workflow when team-default
pnpm dev:docker:win      # Interactive Docker menu for Postgres + app
pnpm build               # next build --webpack; prebuild bumps service worker version
pnpm validate            # tsc + stylelint + CSS variable lint
pnpm test                # Vitest
pnpm docs:dev            # Docusaurus on **:3001**
pnpm docs:build          # Static docs site
pnpm gen:secret          # AUTH_SECRET material for .env.local
```

Environment variables for local Postgres and NextAuth live in `.env.local` — see repo-root `QUICK_START.md`.

## Framework and styling

- **Next.js 16** App Router (`next build --webpack` in scripts).
- **React 19**, **TypeScript** strict.
- Styling: **CSS modules** / SCSS (`src/**/*.module.css`, `stylelint` in `pnpm validate`).
- i18n: **typesafe-i18n** — hub: [/guides/i18n](/guides/i18n).

## Quality gates

| Gate | Command |
| ---- | ------- |
| Types | `pnpm lint` → `tsc --noEmit` |
| CSS | `pnpm lint:css`, `pnpm lint:css:vars` |
| Unit tests | `pnpm test` |
| E2E | `pnpm e2e:headless` when stack is up |

Pre-commit hooks (`husky`, `lint-staged`) run on staged files — do not bypass without reason.

## Documentation tooling

- **Docusaurus 3** scans `src/**/*.md` (`docusaurus.config.js` → `docs.path: 'src'`).
- OpenAPI: `pnpm docs:openapi`; Redoc served at `/api/` on the docs site.
- Co-located markdown neighbors are maintained for coverage reporting; curated hub pages live under `src/guides/`, `src/philosophy/`, `src/products/`, `src/idling/`.

## OpenAPI and admin scripts

- `pnpm docs:openapi` — regenerate `src/app/api/openapi.json`
- `pnpm manage-user`, `pnpm explore-db` — operator CLIs (Node) against Postgres
- `pnpm tui:run` — Go TUI for user management (`cmd/manage-user`)

## Related

- [/guides/getting-started](/guides/getting-started)
- [/guides/stack](/guides/stack)
- Co-located testing detail: [testing.md](./testing.md)