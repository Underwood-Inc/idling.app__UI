import { RADIO_EN } from '$i18n-source/radio.en';
import {
  buildRadioEqualizerCustomPresetNameDrafts,
  buildRadioEqualizerDeleteConfirmMessage,
  buildRadioEqualizerMatchMessage,
} from '@molecules/i18n/idlingRadioI18n';
import { createEmptyRadioEqualizerCustomPresets } from '@widgets/radio-player/radioEqualizerCustomPresets';

describe('RadioPlayerEqualizerPanel messages', () => {
  test('when an exact duplicate is detected, the notice names the matching preset', () => {
    expect(
      buildRadioEqualizerMatchMessage(RADIO_EN, {
        kind: 'exact',
        label: 'Rock',
        presetId: 'rock',
        customSlot: null,
      }).text
    ).toContain('Rock');
  });
});

describe('buildRadioEqualizerCustomPresetNameDrafts', () => {
  test('when custom presets are loaded, each slot draft uses the saved label or the default slot name', () => {
    const presets = createEmptyRadioEqualizerCustomPresets().map((preset) =>
      preset.slot === 1
        ? {
            ...preset,
            label: 'Warm vinyl',
            savedAt: 1,
          }
        : preset
    );

    expect(buildRadioEqualizerCustomPresetNameDrafts(RADIO_EN, presets)).toEqual({
      1: 'Warm vinyl',
      2: 'Custom 2',
      3: 'Custom 3',
    });
  });
});

describe('buildRadioEqualizerDeleteConfirmMessage', () => {
  test('when delete is requested, the confirm copy names the preset', () => {
    expect(buildRadioEqualizerDeleteConfirmMessage(RADIO_EN, 'Warm vinyl')).toContain('Warm vinyl');
  });
});