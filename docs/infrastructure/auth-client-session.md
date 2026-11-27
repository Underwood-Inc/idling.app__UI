# Client auth session hygiene

Shared-browser safety: **do not** leave one account’s client caches visible to the next visitor.

## `AuthClientSessionGuard`

Mounted in `SiteChromeProviders` (inside `SessionProvider`). Runs `useAuthClientSessionLifecycle`, which calls `purgeUserScopedClientStorage` when:

| Trigger | Reason |
|---------|--------|
| App mount, session resolved, no user | `unauthenticated` |
| Signed-in → signed-out | `sign-out` |
| User id changes without full reload | `account-switch` |

## What gets purged

- Radio **song** and **station** favorite object stores in `idling-radio-player` IndexedDB (equalizer / volume prefs kept)
- `localStorage` keys matching auth/session/user/avatar-cache patterns
- `sessionStorage` keys such as `rate-limit-info`
- In-memory **user decoration** batch cache (`UserDataBatchContext`)

`performSecureLogout` (comprehensive) also runs this purge, then clears cookies, caches, and remaining storage.

## UI hooks

Components listen for `idling:purge-user-scoped-client-storage` (e.g. radio player closes the saved-songs panel).

Server authorization remains authoritative; this layer prevents **client cache bleed** only.