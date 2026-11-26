---
title: 'Mystical Card Generator'
description: 'Wizard and advanced modes — OG SVG generation with quota'
---

# Mystical Card Generator

**Route:** `/card-generator` (`src/app/card-generator/page.tsx`, default export `OgImageViewer`).

**What this is:** a logged-in (or guest-quota) tooling flow that renders shareable **OG-style SVG cards** via `GET /api/og-image?format=json`, with wizard vs advanced UI modes, optional PNG download through client-side `convertSvgToPng`.

## UI modes

| Mode | UI | State |
| ---- | -- | ----- |
| Welcome | `WelcomeInterface` | First-visit flow (`useWelcomeFlow`) |
| Wizard | `WizardForm` | Guided fields |
| Advanced | `GenerationForm` + `AdvancedControls` | Pro-tier positioning/watermark knobs |

Mode persists via `useGeneratorMode` (`UserPreferencesContext`). Form fields use **Jotai** atoms (`generatorFormStateAtom`, `src/app/card-generator/atoms/generatorAtoms.ts`).

`layout.tsx` wraps children in `Suspense` + fullscreen `MysticalLoader` fallback.

## Generation API

Primary call: `useImageGeneration` → `noCacheFetch('/api/og-image?…')` with cache-buster query params.

| Query (common) | Purpose |
| -------------- | ------- |
| `format=json` | SVG string + metadata (required for UI) |
| `seed`, `avatarSeed` | Deterministic avatar/pattern |
| `quote`, `author` | Custom copy |
| `width`, `height`, `shapes` | Dimensions / pattern density |
| `ratio` | Preset aspect from form |
| `glassBackground` | Default `true` when advanced options absent |
| Pro knobs | `avatarX/Y`, `watermark*`, `borderColor`, etc. (stripped server-side for free tier — see `OGImageService`) |

**Load saved generation:** `useGenerationLoader` → `GET /api/og-image/[id]?format=json`.

**Quota probe (no generation):** `useQuotaTracking` → `GET /api/og-image?format=json&dry-run=true` (backend `EnhancedQuotaService` / guest quotas — see `OGImageService` `dry-run`).

Co-located API docs: [OG Image index](/app/api/og-image/index), [OGImageService](/app/api/og-image/services/OGImageService). Handler: `src/app/api/og-image/route.tsx` (`withRateLimit`, `withPermissions`).

## Supporting data

| Source | Used for |
| ------ | -------- |
| `getAspectRatios` server action | `src/app/actions/form-options.ts` (cached; reads DB form options) |
| `GET /api/form-options` | Admin CRUD for option rows (Zod + `requireAdminApiAccess`) — not the default wizard fetch path |
| `useSubscriptionStatus` | Pro feature gates in UI |
| `QuotaDisplay` | Remaining generations from API responses |

## Download path

`fileUtils.ts`: optional `POST /api/svg-to-png` or client conversion for PNG export; filenames like `og-image-${seed}-${ratio}.png`.

## Upload (ancillary)

Avatar or custom assets may use `POST /api/upload/image` (multipart, auth required) — see [upload image route](/app/api/upload/image/index) and OpenAPI **Upload** tag (co-located `route.md` may still be bootstrap).

## Operator troubleshooting

| Symptom | Check |
| ------- | ----- |
| Quota stuck at 0 | `dry-run=true` response; guest vs user quota tables (`useQuotaTracking` clears `localStorage` quota keys on auth change) |
| 429 / quota errors | `OGImageService` + subscription tier; admin [quota routes](/idling/api-overview) |
| Advanced controls ignored | Session Pro status; server strips Pro-only params for free users |
| Empty aspect ratios | Postgres `form_options` category + `getAspectRatios` server action |
| Regenerate dialog loop | `useImageGeneration` compares `FormSnapshot` via `showRegenerationDialog` |

## Related

- [API overview](/idling/api-overview)
- [SVG converter](/idling/svg-converter) — shared rasterization service
- [Showcase marketing](/products/showcase/card-generator)

---

**Sources:** `src/app/card-generator/page.tsx`, `src/app/card-generator/hooks/useImageGeneration.ts`, `src/app/card-generator/hooks/useQuotaTracking.ts`, `src/app/card-generator/hooks/useFormOptions.ts`, `src/app/api/og-image/route.tsx`, `src/app/api/og-image/services/OGImageService.ts`, `src/app/actions/form-options.ts`