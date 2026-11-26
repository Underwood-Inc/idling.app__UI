---
title: 'PWA and service worker'
description: 'Radio install manifest, service worker caching, and standalone shell'
---

# PWA and service worker

**What this is:** production builds register `/sw.js` site-wide; the **Idling Radio** web manifest enables standalone install with radio-focused chrome. Development **skips** service worker registration to avoid chunk-load conflicts.

## Web App Manifest

| Field | Value (audited) |
| ----- | ---------------- |
| Files | `public/manifest.json`, `public/idling-radio.webmanifest` (same payload) |
| `id` | `/idling-radio` |
| `display` | `standalone` |
| `start_url` | `/` |
| `scope` | `/` |
| `theme_color` / `background_color` | `#0a0a0e` (`RADIO_PWA_THEME_COLOR`) |
| Icons | `192`, `512` maskable PNG + `180` apple-touch |

Root layout wires manifest + theme color:

- `metadata.manifest` → `RADIO_PWA_MANIFEST_HREF` (`/idling-radio.webmanifest`)
- `<link rel="manifest">` and `<meta name="theme-color">` in `src/app/layout.tsx`

`next.config.js` rewrites `/manifest.json` and `/idling-radio.webmanifest`; `src/proxy.ts` excludes manifests and `sw.js` from auth proxy paths.

## Standalone radio shell

| Constant | Role |
| -------- | ---- |
| `RADIO_PWA_CONTEXT_COOKIE_NAME` (`idling-radio-pwa`) | Server detects PWA display mode |
| `RADIO_PWA_CONTEXT_COOKIE_VALUE` (`standalone`) | Cookie value when installed |
| `IDLING_RADIO_PWA_SHELL_HEADER` (`x-idling-radio-shell`) | Request header for shell routing |
| `RADIO_PWA_BOOT_GUARD_KEY` / `RADIO_PWA_BROWSER_RESTORE_KEY` | `sessionStorage` guards against reload loops |

Components: `RadioPwaContextBootstrap`, `RadioPwaShellBody`, `RadioPwaStandaloneRedirect`, `RadioPwaStandaloneVisualizerBootstrap` under `src/app/components/radio-pwa/`. Client detection: `isStandalonePwa` (`src/lib/radio-pwa/isStandalonePwa.ts`).

`ServiceWorkerRegistration` mounts from `SiteChromeProviders` and `RadioPwaShellBody`.

## Service worker lifecycle

**Registration** (`ServiceWorkerRegistration.tsx`):

1. **Skipped** when `NODE_ENV !== 'production'`.
2. `enforceOneServiceWorker()` before register (drops duplicate registrations).
3. Clears all `caches` keys, waits for `window` `load`, registers `/sw.js` with `scope: '/'`, `updateViaCache: 'none'`.

**Cache versioning** (`public/sw.js`):

- `CACHE_VERSION` placeholder `__VERSION__` replaced from `package.json` version during build.
- Cache names: `idling-app-cache-${CACHE_VERSION}` and metadata sibling.
- **Hard cap:** `MAX_CACHE_AGE` = 12 hours; per-request TTL buckets (static 6h, pages 1h, API 30m, etc., all clamped to max).

**Precache on install:** `/`, favicons, both manifests, `offline.html`, PWA icon set.

**Build hooks** (`package.json`):

| Script | When |
| ------ | ---- |
| `prebuild` | `node scripts/update-sw-version.js` — stamp `CACHE_VERSION` in `sw.js` + layout |
| `postbuild` | same script `--restore` — revert placeholders for dev working tree |
| `pnpm sw:update` / `pnpm sw:restore` | Manual version bump / restore |

## Operator troubleshooting

| Symptom | Check |
| ------- | ----- |
| SW never registers locally | Expected — registration is production-only |
| Multiple stuck SWs | `src/lib/utils/service-worker-cleanup.ts` (`enforceOneServiceWorker`, `nukeAllServiceWorkers`) |
| Stale assets after deploy | `CACHE_VERSION` must change each release (`prebuild` hook) |
| Install shows wrong name | `public/idling-radio.webmanifest` `name` / `short_name` |
| Standalone shell redirect loop | Cookie boot guard keys in `src/lib/radio-pwa/constants.ts` |

## Related

- [Radio](/idling/radio) — player + `/api/radio/*`
- [Stack](/guides/stack) — build pipeline

---

**Sources:** `public/sw.js`, `public/idling-radio.webmanifest`, `src/app/layout.tsx`, `src/lib/radio-pwa/constants.ts`, `src/app/components/service-worker/ServiceWorkerRegistration.tsx`, `scripts/update-sw-version.js`, `package.json` (`prebuild` / `postbuild`)