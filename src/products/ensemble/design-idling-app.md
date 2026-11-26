---
title: design.idling.app
description: Deployed Storybook for Strixun shared components
---

# design.idling.app

**What this is:** Public **Storybook 8** static site for `@strixun/shared-components` — React and Svelte variants, a11y addon, and live docs linked from suite UIs (`StrixunSuiteLink` footer). Live URL: **https://design.idling.app**. Distinct from the NPM package page [Shared Component Library](/products/showcase/shared-components).

## Build and deploy

- **Package:** `strixun-stream-suite/packages/shared-components/package.json`
- **Local docs:** `pnpm storybook` (port 6006); static export `pnpm build-storybook` → `storybook-static/`
- **Pages project:** `packages/shared-components/wrangler.toml` — `name = "storybook"`, `pages_build_output_dir = "storybook-static"`

## Contents

Storybook config under `packages/shared-components/.storybook/` (`main.ts`, Svelte + React CSF stories).

## Failure modes

| Issue | Check |
| ----- | ----- |
| 404 on design host | Pages deploy of `storybook-static`; custom domain binding in Cloudflare |
| Story fails in dev | Matching `vite` + `svelte` versions in package devDependencies |

---

**Sources (audited):** `strixun-stream-suite/packages/shared-components/package.json`, `strixun-stream-suite/packages/shared-components/wrangler.toml`, `strixun-stream-suite/packages/shared-components/.storybook/main.ts`