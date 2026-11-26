---
title: Sign-in page
description: Server route for OAuth provider picker and account-link conflict UI
---

# Sign-in page (`/auth/signin`)

Async Server Component.

## Search params (`Promise<SignInSearchParams>`)

| Param | Use |
|-------|-----|
| `redirect` | Post-auth destination; default `NAV_PATHS.ROOT` |
| `error` | NextAuth error code |
| `provider` | Provider id for conflict copy |
| `reason` | Reserved in type (unused in default branch) |

## Auth flow

1. `await auth()` — if session exists:
   - With `redirect` → `redirect(params.redirect)`
   - Without → `redirect(NAV_PATHS.ROOT)`
2. `error === 'OAuthAccountNotLinked'` → `OAuthAccountConflictHandler` (no sign-in form)
3. Else → `SignInPageClient` with `providers: ['twitch', 'google']` and `redirectTo`

## Exports

Default page only; metadata not defined in this file (inherits/layout).

## Key imports

`PageContainer`, `SignInPageClient`, `OAuthAccountConflictHandler`, `SignInProviders` type from auth-buttons.

## Side effects

`redirect()` throws in Next — no double render after session.

---

**Sources:** `src/app/auth/signin/page.tsx`