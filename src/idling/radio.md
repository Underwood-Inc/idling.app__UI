---
title: Radio player
description: Station catalog probing, ICY now-playing, dock UI, and embed widget
---

# Radio player

**What this is on idling.app:** a docked HTML5 audio player with station browser, favorites, bar/WebGL visualizers, Media Session API, and optional standalone PWA shell. Server routes expose probed stations and live track titles.

## HTTP API (audited)

### `GET /api/radio/stations`

**File:** `src/app/api/radio/stations/route.ts`

- Wraps handler with `withRateLimit`.
- Builds catalog via `buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true)`.
- Probes reachability with `probeRadioStationCatalog` (8s timeout per stream via `probeRadioStreamUrl`).
- Response: JSON probe result from widget catalog.
- **Cache:** `Cache-Control: public, max-age=300`.

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
- [GET /api/radio/now-playing](/app/api/radio/now-playing/route)

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------- |
| All stations “unreachable” | Upstream stream down or probe timeout (`PROBE_TIMEOUT_MS = 8000`) |
| Title stuck | Station has no metadata support flag; check `getCatalogTrackMetadataSupport` |
| Rate limited | `withRateLimit` on both routes |

---

**Sources:** `src/app/api/radio/stations/route.ts`, `src/app/api/radio/now-playing/route.ts`, `src/app/components/radio-player/RadioPlayerBar.tsx`, `src/widgets/radio-player/radioStationCatalog.ts`, `src/widgets/radio-player/radioStationMetadata.ts`, `package.json` (`build:radio-widget-embed`)