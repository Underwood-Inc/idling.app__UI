---
title: 'Stack and tooling'
description: 'Next.js 16, pnpm, Vitest, CSS modules, and development ports'
---

# Stack and tooling

**What this page is about:** the real runtime stack for idling.app__UI as of the current repo — not legacy marketing copy.

## Application stack

| Layer | Choice |
| ----- | ------ |
| Framework | **Next.js 16** (App Router, `next build --webpack`) |
| UI | React 19, **CSS modules** / SCSS (not Tailwind as the primary styling system) |
| Auth | NextAuth.js (`src/app/api/auth/[...nextauth]`) |
| Database | PostgreSQL via project migrations |
| i18n | [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) |
| Unit tests | **Vitest** (`vitest.config.ts`) |
| E2E | **Playwright** (`pnpm e2e`, `pnpm e2e:headless`) |
| Docs site | Docusaurus 3 (`pnpm docs:build`) |

## Common commands

```bash
pnpm dev                 # Next dev (when not using Docker)
pnpm build               # Production Next build
pnpm validate            # tsc + stylelint
pnpm test                # vitest run
pnpm test:coverage       # vitest with coverage
pnpm e2e:headless        # Playwright CI-style
pnpm docs:dev            # Docusaurus on :3001
pnpm docs:build          # Static docs build
```

## Documentation ports

| Service | Port |
| ------- | ---- |
| Next.js app | 3000 |
| Docusaurus docs | **3001** |
| LibreTranslate (optional MT) | 5000 |

## Architecture note

Source is organized with **CLAD**-style boundaries in many areas (`src/molecules/`, services, adapters). See [CLAD hub edition](/philosophy/clad) and the canonical living doc in the workspace repo `docs/philosophy/clad.md` (v0.7.0).

## PWA / production build

`pnpm build` runs `prebuild` / `postbuild` hooks that stamp `CACHE_VERSION` in `public/sw.js` from `package.json` version (`scripts/update-sw-version.js`). Service worker registration is **production-only** — see [PWA](/idling/pwa).

## Deprecated pointers

Repo-root `development.md` and co-located stubs may still mention **Jest**, **Yarn**, or **Next 14**. **This hub page wins** when they disagree. Open a PR to add a deprecation banner to any orphan file you find.

---

**Sources:** `package.json` (`engines`, scripts), `vitest.config.ts`, `next.config.js`, `docusaurus.config.js`