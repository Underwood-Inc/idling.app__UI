---
title: useAspectRatioSync
description: Keeps custom width/height in sync with selected aspect ratio
---

# useAspectRatioSync

`useEffect` hook: when `selectedRatio` changes, finds matching `aspectRatios` entry and writes `customWidth` / `customHeight` on `formState` if empty or mismatched.

## Returns

`getCurrentRatioConfig()` — resolves active `AspectRatioOption` for the selected key.

Expects `AspectRatioOption` objects with numeric `width`/`height` (from `GenerationForm` export).

---

**Sources:** `src/app/card-generator/hooks/useAspectRatioSync.ts`, `src/app/card-generator/components/GenerationForm.tsx`