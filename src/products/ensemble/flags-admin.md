---
title: Flags Admin
description: React Pages app for editing suite feature flags
---

# Flags Admin

**What this is:** Vite **React 19** app **`@strixun/flags-admin`** — authenticated UI for creating and toggling flags against [Feature Flag Service](/products/ensemble/feature-flag-service). Deployed to Cloudflare Pages at **https://flags.idling.app**.

## Frontend entry

- **Package:** `strixun-stream-suite/apps/flags-admin/package.json` (v1.0.0)
- **Build:** `vite build`; output copied to monorepo `dist/flags-admin` for Pages
- **Deploy:** `pnpm run deploy:prod` (`pages-deploy.mjs` + `wrangler.toml` project `flags-admin`)
- **Deps:** `@strixun/feature-flags`, `@strixun/otp-login`, `@strixun/shared-components`, `@strixun/api-framework`

## Pages config

- **Wrangler Pages:** `strixun-stream-suite/apps/flags-admin/wrangler.toml` → `pages_build_output_dir = "../../dist/flags-admin"`

## Failure modes

| Issue | Check |
| ----- | ----- |
| Flags save 403 | OTP session; manage permission via Access / service key on API |
| Stale flag reads | `flags-api.idling.app` worker + D1 migrations |

---

**Sources (audited):** `strixun-stream-suite/apps/flags-admin/package.json`, `strixun-stream-suite/apps/flags-admin/wrangler.toml`