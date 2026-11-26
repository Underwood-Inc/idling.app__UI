---
title: useFormState
description: Local React state for generation form fields
---

# useFormState

Returns memoized field updater for `GenerationFormState`.

## API

- `formState` / `setFormState`
- `updateField(field, value)` — single-key patch
- `clearFormState()` — resets to empty seeds/quotes/dimensions

Initial state matches `useGenerationLoader` reset object (all empty strings).

Note: wizard mode on the page preferentially uses Jotai `generatorFormStateAtom`; this hook is the non-atom alternative path.

---

**Sources:** `src/app/card-generator/hooks/useFormState.ts`, `src/app/card-generator/types/generation.ts`