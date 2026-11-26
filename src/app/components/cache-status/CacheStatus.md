---
title: CacheStatus
description: Footer indicator for current path Cache API entry with SW refresh
---

# CacheStatus

Default export client footer widget for service-worker page caching.

## State

`CacheInfo`: `isCached`, optional `cacheTimestamp`, `cacheAge`, `version`, `cacheVersion`, `details` (SW active, cache count/size, localStorage KB).

## Detection

- Opens `idling-app-cache-v1`, `match(window.location.pathname)`.
- Timestamp: `idling-app-cache-metadata-v1` entry `metadata-${url}` → `cachedAt`; else `Cache-Timestamp`, `Cache-Date`, or `date` headers.
- Scans all cache names for counts; reads `X-App-Version` / `SW-Cache-Version` from first entry when available.

## UI

- **Live** — green indicator when not cached.
- **Cached** — click text toggles details panel; abbreviated age via `TimestampWithTooltip`.
- Refresh button ↻ — `REFRESH_CACHE` message to active SW with `MessageChannel`, then `cache-updated` event and reload after 500ms; fallback `fetch` with `cache: 'no-cache'`.

## Updates

- `cache-updated` listener rechecks status.
- 30s interval refreshes `cacheAge` string when cached.

## Exports

`export default CacheStatus`.

## Edge cases

- Missing `caches` API leaves `isCached: false`.
- Refresh disabled while `isRefreshing`.

---

**Sources:** `src/app/components/cache-status/CacheStatus.tsx`