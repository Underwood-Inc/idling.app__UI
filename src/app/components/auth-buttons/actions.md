---
title: auth-buttons actions
description: Server actions for sign-in and secure server-side sign-out
---

# auth-buttons / actions

`'use server'` module.

## Exports

### `signInAction(provider, redirectTo?)`

- Calls `signIn(provider, { redirectTo: redirectTo || NAV_PATHS.ROOT })` from `src/lib/auth`.
- `revalidatePath('/', 'layout')` after sign-in.

### `signOutAction()`

Security-oriented server logout:

- Logs audit messages (eslint-allowed `console`).
- `signOut({ redirectTo: NAV_PATHS.ROOT })` from `src/lib/auth`.
- `revalidatePath('/', 'layout')`.
- Imports `getSecureCacheBustingHeaders()` for client coordination (headers not settable from server actions directly).
- Rethrows on failure for client handling.

## Types

`provider` typed as `SignInProviders` (`'twitch' | 'google'`).

## Client pairing

Comprehensive browser cache clearing is expected from `ClientSignOut` / secure logout utilities, not from this file alone.

---

**Sources:** `src/app/components/auth-buttons/actions.ts`