import { RADIO_EQUALIZER_BAND_COUNT, normalizeRadioEqualizerBandGains } from './radioEqualizerPresets';
import type { RadioEqualizerCustomPreset, RadioEqualizerCustomSlot } from './radioEqualizer.types';

export const RADIO_EQUALIZER_CUSTOM_SLOT_COUNT = 3;

export const RADIO_EQUALIZER_CUSTOM_SLOTS: RadioEqualizerCustomSlot[] = [1, 2, 3];

export const RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH = 32;

export function normalizeRadioEqualizerCustomPresetLabel(
  label: string,
  slot: RadioEqualizerCustomSlot
): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return `Custom ${slot}`;
  }

  return trimmed.slice(0, RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH);
}

export function createEmptyRadioEqualizerCustomPreset(
  slot: RadioEqualizerCustomSlot
): RadioEqualizerCustomPreset {
  return {
    slot,
    label: `Custom ${slot}`,
    bandGains: Array.from({ length: RADIO_EQUALIZER_BAND_COUNT }, () => 0),
    savedAt: null,
  };
}

export function createEmptyRadioEqualizerCustomPresets(): RadioEqualizerCustomPreset[] {
  return RADIO_EQUALIZER_CUSTOM_SLOTS.map((slot) => createEmptyRadioEqualizerCustomPreset(slot));
}

export function isRadioEqualizerCustomSlot(value: unknown): value is RadioEqualizerCustomSlot {
  return value === 1 || value === 2 || value === 3;
}

export function normalizeRadioEqualizerCustomPresets(value: unknown): RadioEqualizerCustomPreset[] {
  const defaults = createEmptyRadioEqualizerCustomPresets();
  if (!Array.isArray(value)) {
    return defaults;
  }

  return defaults.map((defaultPreset) => {
    const match = value.find((entry) => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      return (entry as RadioEqualizerCustomPreset).slot === defaultPreset.slot;
    }) as RadioEqualizerCustomPreset | undefined;

    if (!match) {
      return defaultPreset;
    }

    const label = normalizeRadioEqualizerCustomPresetLabel(
      typeof match.label === 'string' ? match.label : defaultPreset.label,
      defaultPreset.slot
    );
    const savedAt = typeof match.savedAt === 'number' ? match.savedAt : null;

    if (savedAt === null) {
      return defaultPreset;
    }

    return {
      slot: defaultPreset.slot,
      label,
      bandGains: [...normalizeRadioEqualizerBandGains(Array.isArray(match.bandGains) ? match.bandGains : [])],
      savedAt,
    };
  });
}

export function isRadioEqualizerCustomPresetSaved(preset: RadioEqualizerCustomPreset): boolean {
  return preset.savedAt !== null;
}

export function getRadioEqualizerCustomPresetLabel(
  presets: readonly RadioEqualizerCustomPreset[],
  slot: RadioEqualizerCustomSlot
): string {
  return presets.find((preset) => preset.slot === slot)?.label ?? `Custom ${slot}`;
}

export function replaceRadioEqualizerCustomPreset(
  presets: readonly RadioEqualizerCustomPreset[],
  slot: RadioEqualizerCustomSlot,
  nextPreset: RadioEqualizerCustomPreset
): RadioEqualizerCustomPreset[] {
  return presets.map((preset) => (preset.slot === slot ? nextPreset : preset));
}

export function deleteRadioEqualizerCustomPresetEntry(
  presets: readonly RadioEqualizerCustomPreset[],
  slot: RadioEqualizerCustomSlot
): RadioEqualizerCustomPreset[] {
  return replaceRadioEqualizerCustomPreset(
    presets,
    slot,
    createEmptyRadioEqualizerCustomPreset(slot)
  );
}
