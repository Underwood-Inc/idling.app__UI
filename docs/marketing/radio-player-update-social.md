# Radio player & visualizers — social posts

Copy-paste posts for the idling.app radio + visualizer release. Solo owner voice (I / my).

**Only verified claims below.** See [Verification](#verification) for sources.

**Live:** https://idling.app

---

## LinkedIn

I just shipped a big update on **idling.app**: internet radio with live visualizers built in.

There's a floating player bar with a **large curated station catalog** — jazz, classical, eclectic, electronic, news, ambient, and public/community radio (Radio Paradise, KEXP, BBC Radio 3, CodeRadio, ChillSynth, and more). **Only stations that respond at load time appear in the picker** — some are region-locked, so the list you see depends on your network. You can also **paste your own stream URL** — it saves in your browser and survives site updates.

The fun part: **visualizers that react to the stream in real time.**

- A bar visualizer in the player — **9 dock styles** (plus **Line / Ribbon** wave variants), with **Arc / Halo / Pulse** in fullscreen or PWA only
- **Fullscreen visualizer mode** with **20 spectrum presets** (radial prisms, aurora bloom, gold halo, stereo gate, phosphor trace, and more)
- Opacity and bar height you can tune; fullscreen visualizer settings persist in the browser
- Optional **ambient audio reactivity** in Settings — the page can subtly respond to bass, mids, and treble while you listen

👉 Try it: https://idling.app — play a station, open **Look** on the player, then open the fullscreen visualizer and flip presets.

What's your station + visualizer combo?

#WebDevelopment #React #InternetRadio #AudioVisualizer #SideProject #idlingapp

---

## Facebook

**Big idling.app update — live radio + visualizers 🎶**

Internet radio is built into the site now, with visualizers that move with the music.

🎧 **Curated station catalog** — jazz, classical, eclectic, electronic, news, ambient, and more (Radio Paradise, KEXP, BBC Radio 3, CodeRadio, ChillSynth, and others). The player bar sits at the bottom; **only stations that respond when probed show up** (some are region-locked). **Add your own stream URL** — saved locally in your browser.

📊 **Visualizers**
- Bar visualizer in the player — 9 dock styles, wave ribbon variant, Arc/Halo/Pulse in fullscreen or PWA
- Fullscreen mode with **20 spectrum presets**
- Tweak opacity and bar height; settings stick in your browser

✨ Optional ambient reactivity in **Settings** — subtle page motion tied to the music.

👉 **Try it:** https://idling.app — play something, open **Look**, then go fullscreen and flip presets.

Drop your combo: station + visualizer style. 🎧🌈

---

## Notes

- Best with a 15–30s screen recording of fullscreen visualizer mode.
- Do **not** link to `/widgets/radio-player/` on idling.app — that path is behind site auth today, not a public demo page.
- **Do not quote a fixed station count** in public copy — the catalog is large and availability is probed at runtime (region/network dependent).

---

## Verification

Checked against the repo and a live fetch on 2026-06-25.

| Claim | Status | Source |
| --- | --- | --- |
| Large curated catalog (no fixed public count) | ✅ | `RADIO_STATION_DEFINITIONS` in `src/widgets/radio-player/radioStationCatalog.ts` (261 entries at last count) |
| Fixed station count in marketing | ❌ avoid | Availability is runtime-probed; region-locked streams may be hidden |
| Custom stream URLs | ✅ | URL-only form; `CUSTOM_AUDIO_SOURCES_UI_ENABLED = true`; IndexedDB `idling-radio-player` preserved on deploy resets |
| Only responding stations shown | ✅ | `probeRadioStations()` / `/api/radio/stations` |
| 20 fullscreen spectrum presets | ✅ | `RADIO_VISUALIZER_PRESETS` in `radioVisualizerPresets.ts` |
| 12 bar visualizer styles (9 dock + 3 expanded-only) | ✅ | `BAR_VISUALIZER_PRESET_DEFINITIONS` in `barVisualizerPresets.ts` |
| Compact / Normal / Wide density | ✅ | `RadioPlayerBar.tsx` |
| **Look** panel label | ✅ | `RadioPlayerBar.tsx` |
| Fullscreen visualizer mode | ✅ | `VisualizerModeContext.tsx`, `RadioVisualizerFullscreen.tsx` |
| Fullscreen settings persist | ✅ | `usePersistedRadioFullscreenDisplay.ts` (localStorage) |
| Ambient audio reactivity (Settings) | ✅ | `settings/page.tsx`, `RadioAudioEnergyBridge.tsx` |
| `https://idling.app/widgets/radio-player/` public demo | ❌ do not link | Live fetch returns sign-in page; path not in `PUBLIC_ROUTES` (`src/proxy.ts`) |
| Embeddable widget | ⚠️ code only | Static assets under `public/widgets/radio-player/` — for self-hosting, not a public idling.app page today |
| Example station names | ✅ | All named stations exist in the catalog |
