---
title: useRadioStationFavorites
description: React hook for persisted radio station favorites (IndexedDB)
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

On mount, `listRadioStationFavoriteNames()` loads IDs; effect supports cancellation on unmount. `toggleFavorite` optimistically updates local state then writes through `@widgets/radio-player/radioStationFavoritesIndexedDb`.

---

**Sources:** `src/lib/hooks/useRadioStationFavorites.ts`, `@widgets/radio-player/radioStationFavoritesIndexedDb`