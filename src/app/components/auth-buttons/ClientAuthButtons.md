---
title: ClientAuthButtons
description: Client-side sign-in/out with i18n and secure logout
---

# ClientAuthButtons

`'use client'` counterparts to server `AuthButtons`.

## Exports

- `ClientSignIn`
- `ClientSignOut`

## ClientSignIn

Props: `provider: SignInProviders`, `redirectTo?: string`.

`onClick` → `signIn(provider, { callbackUrl: redirectTo || NAV_PATHS.ROOT, redirect: true })` from `next-auth/react`.

Copy from `AUTH_EN` via `resolveCatalogFromLl` + `useIdlingLocale()`: `{auth.signIn.loginWithProviderPrefix}` + capitalized provider.

`data-testid`: `AUTH_BUTTON_SELECTORS.SIGN_IN`.

## ClientSignOut

Optional `data-testid` (default sign-out selector).

Sign-out sequence:

1. Dynamic import `clearAllRouteFilters` from `src/lib/state/atoms` (warn on failure).
2. `useSecureLogout().secureLogout({ level: 'comprehensive' })`.
3. On failure: fallback `signOut({ callbackUrl: NAV_PATHS.ROOT, redirect: true })`.

Button uses inline font/position styles; label `auth.signIn.signOut`.

## Security

Client path is the comprehensive cache-clearing logout; server `signOutAction` handles server session separately.

---

**Sources:** `src/app/components/auth-buttons/ClientAuthButtons.tsx`