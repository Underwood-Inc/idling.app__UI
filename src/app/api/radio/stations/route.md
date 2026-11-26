---
title: GET /api/radio/stations
description: Probed radio station catalog with reachability metadata
---

# GET /api/radio/stations

Returns the configured **radio station catalog** after a host-region HTTP reachability probe. This route does not check equalizer CORS. That audit runs in GitHub Actions only (`radioStationCatalog.availability.test.ts`).

## Handler

- **Runtime:** `nodejs`
- **Method:** `GET` via `withRateLimit(getHandler)`
- **Probe timeout:** `8000` ms (`PROBE_TIMEOUT_MS`)

## Behavior

1. Builds probe catalog from `RADIO_STATIONS` + `buildRadioStationProbeCatalog(..., hostname, true)`.
2. Calls `probeRadioStationCatalog` with `probeRadioStreamUrl` for each entry. That probe is HTTP HEAD, with GET only when HEAD returns 405 or 501. A 200 marks the station reachable from this server. Missing `Access-Control-Allow-Origin` does not fail it.
3. The browser calls this route. In-browser probing runs only if this request fails, so a normal visit does not measure the listener's region.
4. JSON response is the probe result (reachable streams, failures — see `probeRadioStations` / catalog types in widgets).

## Caching

`Cache-Control: public, max-age=300` (five minutes).

## Related modules

`@widgets/radio-player/radioStationCatalog`, `probeRadioStations`, `radioStreamProbe`, `@lib/middleware/withRateLimit`.

---

**Sources:** `src/app/api/radio/stations/route.ts`