---
title: WizardForm
description: Multi-step Jotai-backed generator wizard
---

# WizardForm

Named export — stepped flow: `platform` → `basic` → `pro` → `confirm`.

## Data

- Reads/writes `generatorFormStateAtom` and field atoms (`currentSeedAtom`, `selectedRatioAtom`, etc.) from `atoms/generatorAtoms.ts`.
- `WizardFormData` shape returned from `onSubmit`.
- Uses `useAspectRatios` for platform step; Pro step gated by `isPro`.

## Props

`onSubmit`, optional `onCancel`, `isGenerating`, `isQuotaExceeded`, collapse toggles, `initialData` partial.

Styles: `WizardForm.module.css`, shared `FormElements.module.css`.

---

**Sources:** `src/app/card-generator/components/WizardForm.tsx`, `src/app/card-generator/atoms/generatorAtoms.ts`