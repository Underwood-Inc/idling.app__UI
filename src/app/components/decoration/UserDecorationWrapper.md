---
title: UserDecorationWrapper
description: Fetches per-user decoration and delegates to DecorationRenderer
---

# UserDecorationWrapper

Client `memo` wrapper wiring `useUserDecoration` + flair preference refresh into `DecorationRenderer`.

## Exports

- `UserDecorationWrapper` — named export
- `UserDecorationWrapperProps` — interface

## Props (`UserDecorationWrapperProps`)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `userId` | `string` | — | Passed to decoration hook |
| `children` | `ReactNode` | — | Wrapped content |
| `className` | `string` | `''` | Forwarded to renderer |
| `forceDecoration` | `string` | — | Override fetched decoration |
| `enabled` | `boolean` | `true` | Hook enable flag |
| `showError` | `boolean` | `false` | Forwarded to renderer |
| `data-testid` | `string` | — | Forwarded to renderer |

## Behavior

- `useFlairPreference()` supplies `refreshTrigger` so decoration re-fetches when flair toggles change.
- Maps `decoration`, `isLoading`, and `error` from `useUserDecoration` into `DecorationRenderer` props unchanged.

---

**Sources:** `src/app/components/decoration/UserDecorationWrapper.tsx`, `@lib/hooks/useUserDecoration`, `@lib/context/UserPreferencesContext`