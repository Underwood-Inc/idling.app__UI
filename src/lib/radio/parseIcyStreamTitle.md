---
title: parseIcyStreamTitle
description: Parse ICY metadata into now-playing display strings
---

# parseIcyStreamTitle

Shoutcast/Icecast metadata helpers for the radio player.

| Function | Role |
| -------- | ---- |
| `parseIcyStreamTitle(metadataText)` | Extract `StreamTitle='…'` / double-quote form |
| `splitArtistTitle(rawTitle)` | Split on ` - ` into artist/title |
| `buildNowPlayingDisplay(streamTitle, station)` | UI string with em dash |
| Additional helpers in file | Map into `RadioNowPlaying` shape |

Strips null bytes before regex match.

---

**Sources:** `src/lib/radio/parseIcyStreamTitle.ts`, `src/lib/radio/radioNowPlaying.types.ts`