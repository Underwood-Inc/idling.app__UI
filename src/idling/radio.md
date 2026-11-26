---
title: Radio player
description: Station catalog probing, ICY now-playing, dock UI, and embed widget
---

# Radio player

**What this is on idling.app:** a docked HTML5 audio player with station browser, favorites, bar/WebGL visualizers, Media Session API, and optional standalone PWA shell. Server routes expose host-region reachability and live track titles. The equalizer attaches only when the stream itself allows cross-origin audio.

## Catalog vs two checks

`RADIO_STATION_DEFINITIONS` in `src/widgets/radio-player/radioStationCatalog.ts` is the trimmed list. A station stays in that list when its resolved playback URL is **HTTPS** and, for `Origin: https://idling.app`, answers **200 or 206** with `Access-Control-Allow-Origin: *` or `https://idling.app`. The player sets `audio.crossOrigin = 'anonymous'` so Web Audio can run the equalizer and spectrum. Streams that omit that header, stay on HTTP, return 401/404, or never connect are left out of the catalog.

Those are two different checks:

| Check | Where it runs | What it decides |
| ----- | ------------- | --------------- |
| Host reachability | `GET /api/radio/stations` on the deployed server | Plain HTTP HEAD (GET if the server rejects HEAD). No CORS requirement. The result is the **host's** region, cached five minutes. A station open there and blocked for a listener still looks available until play fails in that browser. |
| Equalizer health | GitHub Actions only | `radioStationCatalog.availability.test.ts` calls `probeEqualizerRadioStream` on `RADIO_STATIONS` when `GITHUB_ACTIONS=true`. Local `pnpm test` skips it. A failure names the station and the reason (missing CORS, non-HTTPS, HTTP status, timeout). |

The page asks `/api/radio/stations`. `probeRadioStationsInBrowser` runs only when that request fails. It is not the region check for a normal visit.

## HTTP API (audited)

### `GET /api/radio/stations`

**File:** `src/app/api/radio/stations/route.ts`

- Wraps handler with `withRateLimit`.
- Builds catalog via `buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true)`.
- Probes reachability with `probeRadioStationCatalog` (8s timeout per stream via `probeRadioStreamUrl`).
- Response: JSON probe result from widget catalog.
- **Cache:** `Cache-Control: public, max-age=300`.

### `GET /api/radio/playlist?url=`

**File:** `src/app/api/radio/playlist/route.ts`

- Browser playback resolves `.pls` / `.m3u` through this same-origin route so the page does not fetch the playlist cross-origin.
- Server-side resolution and Vitest fetch the playlist URL directly (`playlistFetchUsesAppProxy` is false when `window` is missing or `VITEST=true`).
- Rejects non-http(s) URLs, credentials, localhost, and private addresses. Body cap 256KB. Upstream failure returns **502**.

### `GET /api/radio/now-playing?station=<id>`

**File:** `src/app/api/radio/now-playing/route.ts`

- `dynamic = 'force-dynamic'`.
- **400** if `station` query missing.
- Resolves stream URL from same catalog helper; **404** if unknown station.
- If `getCatalogTrackMetadataSupport(station)` is false: returns `buildRadioNowPlaying(station, null, false)` with **24h** cache.
- Else: `fetchStreamNowPlaying` (ICY/metadata) with **no-store** cache headers.

Station definitions and metadata flags live in `src/widgets/radio-player/radioStationCatalog.ts` and `radioStationMetadata.ts`.

## Client architecture

- **`RadioPlayerBar.tsx`** — main dock UI (favorites, genre filters, human-friendly search, equalizer/WebGL panels, resize). Uses `RadioPlayerContext`, `useRadioCopy` (i18n catalog strings), and hooks under `src/lib/hooks/useRadio*.ts`.
- **`RadioPlayerMount` / `RadioPlayerMountWrapper`** — attaches player into site chrome.
- **Audio reactivity:** `src/lib/audio/computeRadioAudioEnergy.ts`, `ambientAudioReactivity.ts` feed visualizer components.
- **ICY parsing:** `src/lib/radio/parseIcyStreamTitle.ts`, `fetchStreamNowPlaying.ts`.
- **Embed widget:** `pnpm build:radio-widget-embed` (`package.json`) compiles `src/widgets/radio-player/tsconfig.embed.json`.

## PWA coupling

Manifest `start_url` is `/` with `display: standalone` (`public/idling-radio.webmanifest`). Root layout links the same manifest href as the radio shell cookie flow — details in [PWA](/idling/pwa).

## Co-located API docs

- [GET /api/radio/stations](/app/api/radio/stations/route)
- [GET /api/radio/playlist](/app/api/radio/playlist/route)
- [GET /api/radio/now-playing](/app/api/radio/now-playing/route)

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------- |
| All stations “unreachable” | Upstream stream down from the **host** region, or probe timeout (`PROBE_TIMEOUT_MS = 8000`). This list is not the listener's region. |
| Station looks available, then will not play or the equalizer is silent | Browser blocked the stream (listener region, or the station stopped sending equalizer CORS). CI is what rechecks CORS for the catalog. |
| Playlist station fails in the browser console | `/api/radio/playlist` could not fetch that `.pls` / `.m3u` |
| Title stuck | Station has no metadata support flag; check `getCatalogTrackMetadataSupport` |
| Rate limited | `withRateLimit` on the radio routes |
| CI: catalog availability test | GitHub Actions only. The failure text is `Station name: reason (url)`. |

---

**Sources:** `src/app/api/radio/stations/route.ts`, `src/app/api/radio/playlist/route.ts`, `src/app/api/radio/now-playing/route.ts`, `src/app/components/radio-player/RadioPlayerBar.tsx`, `src/widgets/radio-player/radioStationCatalog.ts`, `src/widgets/radio-player/radioEqualizerStreamAudit.ts`, `src/widgets/radio-player/radioStationMetadata.ts`, `src/widgets/radio-player/probeRadioStations.ts`, `package.json` (`build:radio-widget-embed`)