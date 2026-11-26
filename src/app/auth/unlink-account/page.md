---
title: Unlink OAuth account page
description: Guided OAuth unlink flow for signed-in and anonymous users
---

# Unlink OAuth account (`/auth/unlink-account`)

Resolves **OAuthAccountNotLinked** by unlinking provider from another user.

## Search params

`provider` (required), optional `redirect` (post-success target, default `NAV_PATHS.ROOT`).

## Guards

- Missing `provider` → `redirect` to `${NAV_PATHS.CALLBACK}?error=OAuthAccountNotLinked`

## Branches

| Session | Form component |
|---------|----------------|
| No session | `UnauthenticatedUnlinkForm` |
| Session | `UnlinkAccountForm` with `currentUserEmail={session.user.email ?? null}` |

Both branches share static educational content (steps, warnings, support links).

## Auth

Uses `auth()` server-side only to pick form; unlink API calls live in client forms (see sibling components).

## UI

`PageContainer`, `InstantLink` for Cancel (`NAV_PATHS.ROOT`) and support.

---

**Sources:** `src/app/auth/unlink-account/page.tsx`