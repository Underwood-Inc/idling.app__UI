---
title: GET /api/radio/playlist
description: Same-origin fetch of a station playlist for the browser player
---

# GET /api/radio/playlist

Fetches a `.pls` or `.m3u` body on the server and returns it as plain text. The browser player uses this so playlist files are not requested cross-origin. Server-side stream resolution and Vitest do not call this route; they fetch the playlist URL directly.

## Handler

- **Runtime:** `nodejs`
- **Dynamic:** `force-dynamic`
- **Method:** `GET` via `withRateLimit(getHandler)`

## Query

| Param | Required | Notes |
| ----- | -------- | ----- |
| `url` | yes | `http:` or `https:` playlist URL. Credentials, localhost, `.local`, and private addresses are rejected. |

## Responses

| Status | When |
| ------ | ---- |
| `400` | Missing or disallowed `url` |
| `502` | Upstream not OK, body over 256KB, or the fetch failed |
| `200` | Playlist text, `Content-Type: text/plain; charset=utf-8`, `Cache-Control: public, max-age=300` |

## Related modules

`@lib/radio/radioPlaylistProxy` (`isFetchableRadioPlaylistUrl`), `@widgets/radio-player/resolveRadioStreamUrl` (`playlistFetchUsesAppProxy`, `browserPlaylistRequestUrl`).

---

**Sources:** `src/app/api/radio/playlist/route.ts`, `src/lib/radio/radioPlaylistProxy.ts`, `src/widgets/radio-player/resolveRadioStreamUrl.ts`
