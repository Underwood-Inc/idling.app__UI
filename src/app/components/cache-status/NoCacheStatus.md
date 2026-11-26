---
title: NoCacheStatus
description: Aggressive site-data wipe, NextAuth sign-out, and SW re-register
---

# NoCacheStatus

Default export “No Cache” footer control with a single 🧹 action that performs full client reset (no page-cache inspection).

## `clearAllCaches` sequence

1. `signOut({ redirect: false, callbackUrl: '/' })` — continues on failure.
2. Optional `navigator.storage.estimate()` logging.
3. Unregister all service workers.
4. `caches.delete` for every cache name.
5. `localStorage.clear()`, `sessionStorage.clear()`.
6. Clear all cookies for current host/path variants.
7. `deleteNonPreservedIndexedDatabases()` — preserves user radio custom sources.
8. Best-effort WebSQL / `applicationCache` cleanup.
9. Re-register `/sw.js` with `updateViaCache: 'none'`, wait for `active`.
10. `window.location.replace('/')` after 1s (error path same fallback).

## UI

Shows “No Cache” with live indicator; button disabled while `isClearing`.

## Auth

Uses `next-auth/react` `signOut` only (not `performSecureLogout` from security module). Complementary to dev/support tooling, not the production secure logout path.

## Exports

`export default NoCacheStatus`.

---

**Sources:** `src/app/components/cache-status/NoCacheStatus.tsx`