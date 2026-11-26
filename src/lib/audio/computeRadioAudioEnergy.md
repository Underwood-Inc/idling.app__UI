---
title: computeRadioAudioEnergy
description: FFT band energy for radio visualizer CSS variables
---

# computeRadioAudioEnergy

Derives low/mid/high energy bands from analyser node data for the radio dock visualizer.

| Export | Role |
| ------ | ---- |
| `computeRadioAudioEnergy` | Raw band energies from frequency data |
| `smoothRadioAudioEnergy` | Temporal smoothing between frames |
| `EMPTY_RADIO_AUDIO_ENERGY` | Zeroed bands constant |
| `applyRadioAudioEnergyToDocument` / `clearRadioAudioEnergyFromDocument` | CSS custom properties |

---

**Sources:** `src/lib/audio/computeRadioAudioEnergy.ts`