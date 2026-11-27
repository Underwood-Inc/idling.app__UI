---
title: useRadioStationFavorites
description: React hook for cloud-backed radio station favorites with IndexedDB cache
---

# useRadioStationFavorites

Client hook backing favorite stars in the radio player.

## Returns (`UseRadioStationFavoritesResult`)

| Field | Type | Role |
| ----- | ---- | ---- |
| `favoriteStationNames` | `string[]` | Ordered favorite station keys |
| `favoriteStationNameSet` | `Set<string>` | Derived via `createRadioStationFavoriteNameSet` |
| `favoritesLoaded` | `boolean` | Initial IndexedDB read finished |
| `isFavorite` | `(name) => boolean` | Membership check |
| `toggleFavorite` | `(name) => Promise<void>` | Persists via `setRadioStationFavorite` |

## Lifecycle

When signed in, loads from `/api/radio/favorites/stations` and refreshes IndexedDB cache. Guests still use IndexedDB only. `toggleFavorite` optimistically updates local state then writes through the cloud API (or IndexedDB for guests).

---

**Sources:** `src/lib/hooks/useRadioStationFavorites.ts`, `@widgets/radio-player/radioStationFavoritesIndexedDb`