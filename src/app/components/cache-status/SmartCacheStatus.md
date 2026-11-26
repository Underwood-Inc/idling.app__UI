---
title: SmartCacheStatus
description: SW-aware cache footer with metadata, stale flag, refresh and full clear
---

# SmartCacheStatus

Default export enhanced footer combining Cache API inspection, service worker messaging, and two actions.

## Service worker messages

| Type | Purpose |
|------|---------|
| `GET_CACHE_METADATA` | Page metadata: `timestamp`, `isStale`, `ttl` (default 5 min if missing) |
| `GET_CACHE_INFO` | `version`, `totalEntries`, per-bucket TTLs (api/dynamic/static/images) — 2s timeout |
| `REFRESH_CACHE` | Clear caches via SW (no URL in clear-all path) |

## Cached detection

`isCached` true when current URL in any cache, or SW registered, or any cache buckets, or localStorage non-empty. Timestamp falls back to `new Date()` when cached but unknown.

## UI

- Indicator classes: live / cached / **stale** (`isStale`).
- ↻ `handleRefreshCurrentPage` — `window.location.reload()`.
- 🧹 `handleClearAllCache` — storage + IndexedDB (preserved radio DBs) + SW REFRESH_CACHE + unregister + delete caches + re-register `/sw.js` + navigate `/` (no NextAuth sign-out in this handler).

Details panel: page version, TTL minutes, stale flag, SW stats when available.

## Logging

`createLogger` with `enabled: false`; dev-only debug group for cache diagnosis.

## Events

Listens for `cache-updated` (note: effect deps `[]` — does not rebind if `checkCacheStatus` identity changes).

## Exports

`export default SmartCacheStatus`.

## vs `CacheStatus`

Uses SW metadata and stale semantics; clear action does not sign user out (unlike `NoCacheStatus`).

---

**Sources:** `src/app/components/cache-status/SmartCacheStatus.tsx`