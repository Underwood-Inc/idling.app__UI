---
title: ambientAudioReactivity
description: Global CSS intensity from ambient audio slider percent
---

# ambientAudioReactivity

Persists user preference key `ambient-audio-reactivity-global` (0–100%).

- **`parseAmbientAudioReactivityPercent`** / **`clampAmbientAudioReactivityPercent`**
- **`ambientAudioReactivityPercentToIntensity`** — 0–1 scalar
- **`applyAmbientAudioReactivityToDocument`** — sets CSS variables on `document`

Defaults to 100% when unset.

---

**Sources:** `src/lib/audio/ambientAudioReactivity.ts`