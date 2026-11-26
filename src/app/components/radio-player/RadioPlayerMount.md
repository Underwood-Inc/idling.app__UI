---
title: RadioPlayerMount
description: Headless widget mount plus RadioPlayerBar chrome
category: component
---

# RadioPlayerMount

Client bridge between the **imperative** `mountRadioPlayer` widget engine and the React **RadioPlayerBar** UI. Props: optional `autoplay` (default `false`).

## Context

Reads `useRadioPlayer()` for `registerPlayer`, `unregisterPlayer`, `stationDefinitions`, and `stationAvailabilityByName`.

## Mount lifecycle (`useEffect`)

1. Adds `has-radio-player` on `document.body` while mounted.
2. Builds stations via `buildRadioStationCatalog(stationDefinitions)`.
3. Calls `mountRadioPlayer(host, { autoplay, stations, stationDefinitions, headless: true })` into a hidden host `div` (`engineHost`, `aria-hidden`, `data-testid="radio-player-host"`).
4. Registers handle with context via `registerPlayer`.
5. **Cleanup:** `unregisterPlayer()`, `destroy()` on widget handle, removes body class, clears `--irp-bar-height` and `--irp-dock-height` on `document.documentElement`.

Re-runs when `autoplay`, `stationDefinitions`, or register/unregister callbacks change.

## Availability diagnostics

Separate effect waits until every station has left `pending` availability state. If **zero** stations are `available`, logs unreachable streams through `logRadioPlayerUnavailable` with name, url, and reason (for support consoles).

## Render tree

Hidden engine host + visible `RadioPlayerBar`. Audio playback and analyser wiring live in the widget; bar components consume the registered handle from context.

---

**Sources:** `src/app/components/radio-player/RadioPlayerMount.tsx`, `@lib/context/RadioPlayerContext`, `@widgets/radio-player/radio-player`, `@widgets/radio-player/radioStationCatalog`, `@widgets/radio-player/radioStationBrowse`, `@widgets/radio-player/probeRadioStations`