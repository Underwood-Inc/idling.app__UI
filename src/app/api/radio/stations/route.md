---
title: GET /api/radio/stations
description: Probed radio station catalog with reachability metadata
---

# GET /api/radio/stations

Returns the configured **radio station catalog** after live probes (stream URL resolution per request hostname).

## Handler

- **Runtime:** `nodejs`
- **Method:** `GET` via `withRateLimit(getHandler)`
- **Probe timeout:** `8000` ms (`PROBE_TIMEOUT_MS`)

## Behavior

1. Builds probe catalog from `RADIO_STATIONS` + `buildRadioStationProbeCatalog(..., hostname, true)`.
2. Calls `probeRadioStationCatalog` with `probeRadioStreamUrl` for each entry.
3. JSON response is the probe result (reachable streams, failures, etc. — see `probeRadioStations` / catalog types in widgets).

## Caching

`Cache-Control: public, max-age=300` (five minutes).

## Related modules

`@widgets/radio-player/radioStationCatalog`, `probeRadioStations`, `radioStreamProbe`, `@lib/middleware/withRateLimit`.

---

**Sources:** `src/app/api/radio/stations/route.ts`