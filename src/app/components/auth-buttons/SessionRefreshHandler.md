---
title: SessionRefreshHandler
description: OAuth callback session refresh, periodic validation, and fetch interception
---

# SessionRefreshHandler

Invisible client component (`return null` from inner handler; outer wraps OAuth logic in `Suspense`).

## OAuth callback (`SessionRefreshHandlerInternal`)

Detects callback via search params (`code`, `state`, OAuth tokens, `session_state`) or pathname containing `/api/auth/callback`.

When callback + (`loading` or unauthenticated with attempts &lt; 3): after 1.5s calls `update()` from `useSession()`, then after 1s clears query string via `history.replaceState` if user present; retries up to 3 times.

Requires `Suspense` because of `useSearchParams()`.

## Session validation (outer)

When `authenticated` and `session.user.id`:

- Every 30 minutes reads `sessionDataAtom` (from API wrappers, not a dedicated validate endpoint).
- If atom data younger than 5 minutes: sign out with `performSecureLogout` + `signOut` when `!isValid`, `timeoutInfo.is_timed_out`, or `!userInfo.is_active`.
- Callback URLs: `/auth/signin?reason=session_invalid|user_timed_out|user_inactive`.

## Global `fetch` patch

On mount, wraps `window.fetch`:

- Response headers `X-Session-Invalidated`, `X-Require-Full-Logout`, `X-Clear-Session` → comprehensive secure logout + redirect `reason=security_invalidation` (fallback `fallback_invalidation`).
- 401/404 on `/api/` JSON with `clearSession` or `requiresReauth` → secure logout, `reason=api_invalidation`.

Restores original `fetch` on unmount.

## Edge cases

- Validation errors do not auto sign-out (transient failures).
- `router` in OAuth effect deps is unused for navigation (URL cleaned manually).

---

**Sources:** `src/app/components/auth-buttons/SessionRefreshHandler.tsx`