---
title: useRadioMediaSession
description: Media Session API sync for radio playback
---

# useRadioMediaSession

Registers handlers and metadata when `handle` (radio player) is available.

## Options

`stationDefinitions`, `stationName`, `trackDisplay`, `isPlaying`, skip callbacks `onNextStation`, `onPreviousStation`, `onPlaybackSync`.

Delegates to `registerRadioMediaSessionHandlers`, `syncRadioMediaSessionMetadata`, and playback state sync in `@widgets/radio-player/radioMediaSession`.

---

**Sources:** `src/lib/hooks/useRadioMediaSession.ts`, `@widgets/radio-player/radioMediaSession`