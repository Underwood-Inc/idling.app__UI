---
title: useNavigationLoader
description: Alias for NavigationLoadingContext consumer API
---

# useNavigationLoader

`'use client'`. Single-line delegate to `useNavigationLoading()` from `NavigationLoadingContext`.

## Return shape (`NavigationLoadingContextType`)

| Field | Meaning |
|-------|---------|
| `navigate(path, { scroll? })` | `router.push` wrapped in `startTransition`; no-ops when `pathname === path`; sets loading state immediately |
| `isNavigating` | UI should show progress bar / blocking chrome |
| `targetPath` | Destination path while transition pending |
| `isPending` | Mirrors React `useTransition` pending flag |

## Provider behavior (context)

`NavigationLoadingProvider` clears loading when `pathname` changes or after **10s** fallback timeout. Throws if hook used outside provider.

## Consumers

`NavigationLoadingBar`, `InstantLink`, and `GlobalLoadingContext` (calls `navigate` for coordinated loading).

## Edge cases

Duplicate navigation to current path is ignored. Timeout prevents stuck loading if router aborts.

---

**Sources:** `src/lib/hooks/useNavigationLoader.ts`, `src/lib/context/NavigationLoadingContext.tsx`