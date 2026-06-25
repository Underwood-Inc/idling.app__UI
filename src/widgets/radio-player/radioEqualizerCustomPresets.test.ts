import {
  createEmptyRadioEqualizerCustomPreset,
  deleteRadioEqualizerCustomPresetEntry,
  isRadioEqualizerCustomPresetSaved,
  normalizeRadioEqualizerCustomPresetLabel,
  normalizeRadioEqualizerCustomPresets,
  RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH,
} from './radioEqualizerCustomPresets';

describe('radioEqualizerCustomPresets', () => {
  test('when a custom preset label is normalized, whitespace is trimmed and empty values fall back to the slot name', () => {
    expect(normalizeRadioEqualizerCustomPresetLabel('  Bass boost  ', 2)).toBe('Bass boost');
    expect(normalizeRadioEqualizerCustomPresetLabel('   ', 3)).toBe('Custom 3');
  });

  test('when a custom preset label is too long, it is truncated to the max length', () => {
    const longLabel = 'a'.repeat(RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH + 8);

    expect(normalizeRadioEqualizerCustomPresetLabel(longLabel, 1)).toHaveLength(
      RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH
    );
  });

  test('when a saved custom preset is deleted, the slot resets to an empty preset with the default label', () => {
    const savedPreset = {
      ...createEmptyRadioEqualizerCustomPreset(1),
      label: 'Night drive',
      bandGains: [2, 1, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
      savedAt: 1_700_000_000_000,
    };
    const presets = [savedPreset, createEmptyRadioEqualizerCustomPreset(2), createEmptyRadioEqualizerCustomPreset(3)];

    const nextPresets = deleteRadioEqualizerCustomPresetEntry(presets, 1);
    const clearedPreset = nextPresets.find((preset) => preset.slot === 1);

    expect(clearedPreset?.label).toBe('Custom 1');
    expect(clearedPreset?.savedAt).toBeNull();
    expect(isRadioEqualizerCustomPresetSaved(clearedPreset!)).toBe(false);
  });

  test('when stored custom presets include labels, they are normalized on load', () => {
    const presets = normalizeRadioEqualizerCustomPresets([
      {
        slot: 2,
        label: '  Lounge  ',
        bandGains: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        savedAt: 42,
      },
    ]);

    expect(presets.find((preset) => preset.slot === 2)?.label).toBe('Lounge');
  });
});
