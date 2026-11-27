---
title: GET /api/radio/now-playing
description: ICY/stream title metadata for a named station
---

# GET /api/radio/now-playing

Resolves **now playing** metadata for one station id from the radio widget catalog.

**Authentication:** NextAuth session required (`proxy.ts` + `requireRadioApiSession`). Anonymous clients receive **401** `{ code: 'AUTH_REQUIRED' }`.

## Handler

- **Runtime:** `nodejs`
- **Dynamic:** `force-dynamic`
- **Method:** `GET` via `withRateLimit(getHandler)`

## Query

| Param | Required | Notes |
| ----- | -------- | ----- |
| `station` | yes | Catalog station key; trimmed |

## Responses

| Status | When |
| ------ | ---- |
| `401` | No signed-in app user |
| `400` | Missing `station` — `{ error: 'station query parameter is required' }` |
| `404` | Unknown station — `{ error: 'Unknown station' }` |
| `200` | `RadioNowPlaying` JSON |

## Metadata path

1. Resolve stream URL from `buildRadioStationProbeCatalog` + hostname.
2. If `getCatalogTrackMetadataSupport(station)` is **false**, return `buildRadioNowPlaying(station, null, false)` with long cache (`max-age=86400`).
3. Else `fetchStreamNowPlaying(station, streamUrl)` with **no-store** cache headers.

---

**Sources:** `src/app/api/radio/now-playing/route.ts`, `@lib/radio/fetchStreamNowPlaying`, `@lib/radio/parseIcyStreamTitle`