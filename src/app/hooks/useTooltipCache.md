---
title: useTooltipCache
description: localStorage LRU cache for link tooltip preview payloads
---

# useTooltipCache

Client hook backing link tooltip preview persistence.

## Signature

`useTooltipCache(url: string, cacheDuration = 1 hour)`

## Return shape

| Field | Purpose |
|-------|---------|
| `isCached`, `lastUpdated` | React state mirrors (also setters exposed) |
| `getCachedData(url)` | Read + TTL check; bumps `accessCount` / `lastAccessed` |
| `setCachedData(url, data)` | Write with size/count limits |
| `clearAllCache()` | Removes all `link_tooltip_cache_*` keys + metadata |
| `getCacheStats()` | Entry count, bytes, caps |

## Storage keys

- Per URL: `link_tooltip_cache_${url}`
- Index: `link_tooltip_cache_metadata` — `CacheEntry[]` with LRU metadata

## Limits

- Max **50** entries
- Max **5MB** total (Blob size of JSON)
- TTL per hook arg (default 1h); expired entries removed on read

## Eviction

`evictOldestItems` sorts by `lastAccessed`, removes keys until space/count OK. `setCachedData` retries once after eviction if `setItem` throws.

## Edge cases

Parse failures delete corrupt keys. Metadata/localStorage failures warn to console and degrade gracefully (`null` stats, empty metadata).

---

**Sources:** `src/app/hooks/useTooltipCache.ts`