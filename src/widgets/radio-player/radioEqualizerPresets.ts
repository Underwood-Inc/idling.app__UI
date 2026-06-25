import { createEmptyRadioEqualizerCustomPresets } from './radioEqualizerCustomPresets';
import { createRadioEqualizerLastSelectionFromPreset } from './radioEqualizerLastSelection';
import type {
  RadioEqualizerBandGains,
  RadioEqualizerPresetDefinition,
  RadioEqualizerPresetId,
  RadioEqualizerSettings,
} from './radioEqualizer.types';

export const RADIO_EQUALIZER_BAND_COUNT = 12;

export const RADIO_EQUALIZER_BAND_FREQUENCIES_HZ: readonly number[] = [
  32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 10000, 12000, 16000,
];

export const RADIO_EQUALIZER_BAND_LABELS: readonly string[] = [
  '32',
  '64',
  '125',
  '250',
  '500',
  '1k',
  '2k',
  '4k',
  '8k',
  '10k',
  '12k',
  '16k',
];

export const RADIO_EQUALIZER_GAIN_RANGE = {
  min: -12,
  max: 12,
  step: 0.5,
} as const;

export const RADIO_EQUALIZER_PRESET_DEFINITIONS: RadioEqualizerPresetDefinition[] = [
  {
    id: 'flat',
    label: 'Flat',
    bandGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'bass-boost',
    label: 'Bass boost',
    bandGains: [6, 5, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'treble-boost',
    label: 'Treble boost',
    bandGains: [0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 6, 6],
  },
  {
    id: 'vocal',
    label: 'Vocal',
    bandGains: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1, -2, -2],
  },
  {
    id: 'rock',
    label: 'Rock',
    bandGains: [4, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1],
  },
  {
    id: 'jazz',
    label: 'Jazz',
    bandGains: [0, 2, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1],
  },
  {
    id: 'electronic',
    label: 'Electronic',
    bandGains: [5, 4, 2, 0, 0, 0, 1, 2, 3, 4, 4, 3],
  },
  {
    id: 'podcast',
    label: 'Podcast',
    bandGains: [-3, -2, 0, 2, 4, 5, 5, 4, 2, 0, -2, -3],
  },
];

export function isRadioEqualizerPresetId(value: unknown): value is RadioEqualizerPresetId {
  return (
    typeof value === 'string' &&
    RADIO_EQUALIZER_PRESET_DEFINITIONS.some((preset) => preset.id === value)
  );
}

export function getRadioEqualizerPreset(
  presetId: RadioEqualizerPresetId
): RadioEqualizerPresetDefinition {
  return (
    RADIO_EQUALIZER_PRESET_DEFINITIONS.find((preset) => preset.id === presetId) ??
    RADIO_EQUALIZER_PRESET_DEFINITIONS[0]
  );
}

export function createDefaultRadioEqualizerBandGains(): number[] {
  return Array.from({ length: RADIO_EQUALIZER_BAND_COUNT }, () => 0);
}

export function createDefaultRadioEqualizerSettings(): RadioEqualizerSettings {
  return {
    presetId: 'flat',
    customPresetSlot: null,
    bandGains: createDefaultRadioEqualizerBandGains(),
    customPresets: createEmptyRadioEqualizerCustomPresets(),
    lastSelection: createRadioEqualizerLastSelectionFromPreset('flat'),
  };
}

export function normalizeRadioEqualizerBandGains(
  bandGains: readonly number[]
): RadioEqualizerBandGains {
  const { min, max } = RADIO_EQUALIZER_GAIN_RANGE;
  const normalized = createDefaultRadioEqualizerBandGains();

  for (let index = 0; index < RADIO_EQUALIZER_BAND_COUNT; index += 1) {
    const value = bandGains[index] ?? 0;
    normalized[index] = Math.min(max, Math.max(min, value));
  }

  return normalized;
}
