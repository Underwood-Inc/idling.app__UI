---
title: Source-audit documentation
description: How hub and co-located docs must be written — from code, not README guesswork
sidebar_position: 2
---

# Source-audit documentation

**What this page is about:** every doc claim must trace to a file you opened in the repo that owns the behavior. Marketing copy and stale READMEs are hints only.

## Rule

1. **Open the implementation** (`.ts`, `.tsx`, `route.ts`, `plugin.yml`, `.java`, `wrangler.toml`, etc.).
2. **Write what it actually does** — exports, HTTP methods, permissions, config keys, event listeners.
3. **Cite sources** in a footer block: `Sources: path/to/file.ts, other/file.java`.
4. If README and code disagree, **code wins**; note the drift in the doc or fix the README in that product repo.

**Forbidden:** paraphrasing another repo’s README without reading its source; bootstrap filler (“co-located doc standards…”) with no behavior; inventing endpoints not in `route.ts` or OpenAPI.

## Hub products outside idling.app

Sibling code lives under `Documents/__CODE/<repo>/`. For each product page on docs.idling.app:

| Product type | Start here |
| ------------ | ----------- |
| Paper plugin | `plugin/src/main/resources/plugin.yml`, `*Plugin.java`, command/listener classes |
| Next route | `src/app/**/page.tsx`, colocated `layout.tsx` |
| API | `src/app/api/**/route.ts`, generated `openapi.json` |
| Cloudflare worker | `wrangler.toml`, `src/index.ts` or handler entry |
| Tauri desktop | `src-tauri/`, main Rust/TS entry, `tauri.conf.json` |

## idling.app co-located neighbors

Files under `src/app/**.md` and `src/lib/**.md` in the **Code-adjacent** sidebar are not done when a bootstrap stub exists. Upgrade them with the same audit: read the sibling `.ts`/`.tsx`, document props, hooks, and side effects.

## Inventory

When you verify a product page, update [Product inventory](/products/inventory): set `last_verified` and list **source files**, not “README”.

## Related

- [Contributing](/guides/contributing)
- [Documentation coverage](/guides/documentation-coverage) — coverage badge measures markdown presence, not audit quality