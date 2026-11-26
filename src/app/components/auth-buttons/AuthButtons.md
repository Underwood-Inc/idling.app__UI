---
title: AuthButtons (SignIn / SignOut)
description: Server-action forms for NextAuth sign-in and sign-out
---

# AuthButtons

RSC-safe auth controls using server actions (no `'use client'`).

## Exports

- `SignIn`
- `SignOut`
- Re-export type `SignInProviders` from `./types`

## SignIn

Props: `provider: SignInProviders`, `redirectTo?: string`.

`<form action={signInAction.bind(null, provider, redirectTo)}>` with submit button `data-testid={AUTH_BUTTON_SELECTORS.SIGN_IN}`, label “Login with {provider}” (capitalized via CSS).

## SignOut

Optional `data-testid` (defaults to `AUTH_BUTTON_SELECTORS.SIGN_OUT`).

`<form action={signOutAction}>` — “Sign Out” submit.

## Styling

Imports `AuthButtons.css`; button class `auth-button`.

## Auth flow

Delegated to `actions.ts` (`signIn` / `signOut` from `src/lib/auth`, `revalidatePath('/', 'layout')`).

---

**Sources:** `src/app/components/auth-buttons/AuthButtons.tsx`, `src/app/components/auth-buttons/actions.ts`