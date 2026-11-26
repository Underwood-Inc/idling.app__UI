---
title: LoadingButton
description: Button that disables during async onClick and optionally drives global loading
---

# LoadingButton

## Props (`LoadingButtonProps`)

| Prop | Default | Notes |
|------|---------|-------|
| `onClick` | required | `async` or sync; awaited |
| `variant` | `'primary'` | `primary` \| `secondary` \| `danger` \| `ghost` |
| `size` | `'md'` | `sm` \| `md` \| `lg` |
| `loadingText` | — | Replaces children while busy |
| `globalLoadingMessage` | — | When set, `startLoading` / `stopLoading` on `GlobalLoadingContext` |
| `type` | `'button'` | Native button type |

Sets `aria-busy` while loading; rethrows errors after logging.

## Hook: `useAsyncAction`

Returns `{ execute, isLoading }` for the same global-loading pattern outside a button: `execute(fn, { globalMessage, onSuccess, onError })`.

---

**Sources:** `src/app/components/ui/LoadingButton.tsx`, `@lib/context/GlobalLoadingContext`