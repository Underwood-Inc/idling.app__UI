---
title: Auth callback page
description: Post-OAuth holding page, errors, and auto-redirect when session exists
---

# Auth callback page (`/auth/callback`)

Handles UX between OAuth return and app entry.

## Server entry

`CallbackPage`: `await searchParams`, `await auth()`.

- **If session already present:** `redirect(params.redirect || NAV_PATHS.ROOT)` immediately (skips spinner UI).

## `CallbackContent` (client tree under Suspense)

Search: `redirect`, `error`, `provider`, `state`.

### Errors

- `OAuthAccountNotLinked` → inline `OAuthAccountConflictHandler` (unlink / support / home links)
- Other known NextAuth codes → specific copy (`OAuthSignin`, `OAuthCallback`, `CredentialsSignin`, …)
- Unknown `error` → generic authentication message
- Actions: Try Again → `NAV_PATHS.SIGNIN`, Go Home → root

### Success (no error)

Renders `AutoRedirect` with `redirectTo || NAV_PATHS.ROOT` plus loading spinner/progress UI.

## Nested `OAuthAccountConflictHandler`

Duplicate of sign-in conflict UI: three resolution paths including `/auth/unlink-account?provider=…`.

## Loading

`Suspense` fallback: shared `Loader` inside `PageContainer`.

---

**Sources:** `src/app/auth/callback/page.tsx`