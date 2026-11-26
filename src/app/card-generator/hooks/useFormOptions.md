---
title: useFormOptions (useAspectRatios)
description: Server-action fetch for aspect ratio catalog
---

# useAspectRatios

Exported from `useFormOptions.ts` — loads aspect ratio options for forms.

## API

```typescript
useAspectRatios(autoFetch?: boolean)
```

Returns `{ data, isLoading, error, fetchIfNeeded }` where `data.aspect_ratios` is `AspectRatioOption[]`.

## Data source

`getAspectRatios()` server action from `src/app/actions/form-options` (not raw fetch).

Auto-fetches on mount when `autoFetch` is true and cache empty.

---

**Sources:** `src/app/card-generator/hooks/useFormOptions.ts`, `src/app/actions/form-options.ts`