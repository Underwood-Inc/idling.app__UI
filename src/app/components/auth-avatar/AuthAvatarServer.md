---
title: AuthAvatarServer
description: Async server component avatar using @lib/auth session
---

# AuthAvatarServer

Server-side avatar for RSC layouts. **Not** exported from `auth-avatar/index.ts` (direct import only — uses `@lib/auth`).

## Props

- `session?: Session | null` — when omitted, calls `await auth()`.
- `size`, `enableTooltip`, `tooltipScale`, `className` — same defaults as `AuthAvatar`.

## Seed logic

Authenticated: same fallback chain as client (`id` → `name` → `email` → `'authenticated-fallback'`).

Unauthenticated: random `guest-{base36}-{Date.now()}` per request (differs from client guest seed by design).

## Exports

Named async function `AuthAvatarServer`.

## Edge cases

- Guest avatars differ on each server render unless session is passed in.
- No loading skeleton (server renders `Avatar` immediately).

---

**Sources:** `src/app/components/auth-avatar/AuthAvatarServer.tsx`