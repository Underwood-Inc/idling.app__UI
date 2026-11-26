---
title: AuthAvatar
description: Client avatar for the current NextAuth session with stable user seed
---

# AuthAvatar

Client component that renders `Avatar` for the signed-in user (or guest) using a deterministic seed from session identity.

## Props

- `size?: AvatarPropSizes` — default `'md'`
- `enableTooltip?: boolean` — default `false`
- `tooltipScale?: 2 | 3 | 4` — default `2`
- `className?: string` — wrapper `div`

## Auth

- `useSession()` from `next-auth/react`.
- Seed when authenticated: `user.id`, else `name`, else `email`, else `'authenticated-fallback'`.
- Guest: static seed `'guest-user'` (avoids hydration mismatch vs server random guest).

## State

- `avatarCacheAtom` (Jotai): cleared to `{}` on sign-out (user id transition) and whenever `session` is null.

## Loading

`status === 'loading'` → empty placeholder `div` at 2rem × 2rem (no avatar flash).

## Markup

Wrapper `div`; inner `Avatar` with `key={session?.user?.id || 'guest'}` to remount on user change.

---

**Sources:** `src/app/components/auth-avatar/AuthAvatar.tsx`