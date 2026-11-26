---
title: GenerationForm
description: Compact generator form with aspect ratios and Pro advanced section
---

# GenerationForm

Named export — primary **non-wizard** generator UI inside a `Card`.

## Highlights

- Loads aspect ratios via `useAspectRatios()`; exports `AspectRatioOption` (includes numeric width/height).
- Controlled props for seeds, quote/author, dimensions, shape count, generate/randomize handlers.
- Collapsible sections; embeds `AdvancedControls` when `isProUser`.
- `isReadOnly` locks inputs for loaded generations.
- Copy via `useToolsCopy().cardGenerator` + locale catalogs.

Pairs with `useAspectRatioSync` on the parent page when sharing `GenerationFormState`.

---

**Sources:** `src/app/card-generator/components/GenerationForm.tsx`, `src/app/card-generator/components/FormElements.module.css`, `src/app/card-generator/components/AdvancedControls.tsx`