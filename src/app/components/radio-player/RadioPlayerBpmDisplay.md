# RadioPlayerBpmDisplay

Props: `isPlaying`. Polls `RadioPlayerHandle.getAudioStreamTempo()` every 200ms via `useAudioStreamTempo` when playing; shows BPM from `resolveAudioStreamTempoBpmDisplay` with localized description.

Also exports `useAudioStreamTempo({ isPlaying })` for other visualizers.

---

**Sources:** `src/app/components/radio-player/RadioPlayerBpmDisplay.tsx`