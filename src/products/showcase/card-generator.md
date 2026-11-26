---
title: Card Generator
description: Idling.app Next.js tool — procedural OG card SVG via /api/og-image
---

# Card Generator

**What this is:** **Next.js App Router** feature at `/card-generator` in **`idling.app__UI`** — wizard and form UI for quote/avatar cards, quota tracking for signed-in users, PNG download from generated SVG.

## UI entry

- **Page:** `idling.app__UI/src/app/card-generator/page.tsx` — client page wiring Jotai form state, wizard flow, subscription/quota hooks.
- **Generation hook:** `src/app/card-generator/hooks/useImageGeneration.ts` — fetches `/api/og-image?…` via `noCacheFetch`, manages seeds, aspect ratio, Pro options.

## API entry

- **Route:** `src/app/api/og-image/route.tsx` — OG image pipeline
- **Services:** `src/app/api/og-image/services/OGImageService.ts`, `SVGGenerator.ts`, pattern generators, `DatabaseService.ts` (quota / persistence)

## User model

- Session via NextAuth (`useSession` on page); quota display via `useQuotaTracking` / `useSubscriptionStatus`.
- Client-side PNG export: `convertSvgToPng` in `src/app/card-generator/utils/fileUtils.ts`.

## Failure modes

| Issue | Check |
| ----- | ----- |
| 429 / quota | OG image route quota + `MachineFingerprint` |
| Blank preview | Network tab on `/api/og-image` query params from hook |
| Pro options ignored | `GenerationOptions` passed through hook overrides |

---

**Sources (audited):** `idling.app__UI/src/app/card-generator/page.tsx`, `idling.app__UI/src/app/card-generator/hooks/useImageGeneration.ts`, `idling.app__UI/src/app/api/og-image/route.tsx`