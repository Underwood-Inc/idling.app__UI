---
title: Card generator page
description: OG image / card wizard with Jotai form state and quota hooks
---

# Card generator page (`/card-generator`)

Default export name `OgImageViewer` — client-only generator UI.

## State architecture

- Local: `svgContent`, `selectedRatio`, `currentGenerationId`, `error`, `advancedOptions`, collapse flags
- **Jotai:** `generatorFormStateAtom`, `resetFormAtom`, `updateFormStateAtom`
- **Hooks:** `useFormState`, `useQuotaTracking`, `useSubscriptionStatus`, `useWelcomeFlow`, `useGenerationLoader`, `useImageGeneration`, `useAspectRatios` (server action–backed options)

## Modes

`useGeneratorMode()` from `UserPreferencesContext` toggles wizard vs compact UI; `WelcomeInterface` vs `WizardForm` / `GenerationForm`.

## Generation flow

`GenerationDisplay` shows SVG output; `convertSvgToPng`, `downloadFile`, `generateFilename` from `fileUtils`. `RegenerationDialog` for confirm/regen.

## Session

`useSession()` gates Pro/advanced options via `subscriptionStatus` + quota hooks.

## URL

`useSearchParams()` can deep-link generation params (see file for load-by-id effects).

## Providers

Wrapped in `ToolsCopyProvider` for tools i18n.

---

**Sources:** `src/app/card-generator/page.tsx`, `src/app/card-generator/atoms/generatorAtoms.ts`