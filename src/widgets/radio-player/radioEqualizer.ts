import {
  RADIO_EQUALIZER_BAND_FREQUENCIES_HZ,
  normalizeRadioEqualizerBandGains,
} from './radioEqualizerPresets';
import type { RadioEqualizerChain } from './radioEqualizer.types';

const EQUALIZER_Q = 1.41;

export function createRadioEqualizerChain(audioContext: AudioContext): RadioEqualizerChain {
  const filters = RADIO_EQUALIZER_BAND_FREQUENCIES_HZ.map((frequency) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = EQUALIZER_Q;
    filter.gain.value = 0;
    return filter;
  });

  for (let index = 0; index < filters.length - 1; index += 1) {
    filters[index].connect(filters[index + 1]);
  }

  const setBandGains = (bandGains: readonly number[]) => {
    const normalized = normalizeRadioEqualizerBandGains(bandGains);
    filters.forEach((filter, index) => {
      filter.gain.value = normalized[index] ?? 0;
    });
  };

  return {
    input: filters[0],
    output: filters[filters.length - 1],
    setBandGains,
    disconnect() {
      filters.forEach((filter) => {
        filter.disconnect();
      });
    },
  };
}
