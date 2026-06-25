import { getRadioEqualizerPreset } from './radioEqualizerPresets';
import {
  isRadioEqualizerBandGainsExactMatch,
  resolveRadioEqualizerBandGainsMatch,
} from './radioEqualizerMatch';
import { normalizeRadioEqualizerLastSelection } from './radioEqualizerLastSelection';

describe('radioEqualizerMatch', () => {
  test('when sliders match a preset exactly, the matcher reports an exact duplicate', () => {
    const rock = getRadioEqualizerPreset('rock').bandGains;

    expect(
      resolveRadioEqualizerBandGainsMatch({
        bandGains: [...rock],
        customPresets: [],
        activePresetId: null,
        activeCustomSlot: null,
      })
    ).toEqual({
      kind: 'exact',
      label: 'Rock',
      presetId: 'rock',
      customSlot: null,
    });
  });

  test('when the active preset already matches, duplicate notices stay hidden', () => {
    const rock = getRadioEqualizerPreset('rock').bandGains;

    expect(
      resolveRadioEqualizerBandGainsMatch({
        bandGains: [...rock],
        customPresets: [],
        activePresetId: 'rock',
        activeCustomSlot: null,
      })
    ).toBeNull();
  });

  test('when sliders are close but not exact, the matcher warns with the nearest preset', () => {
    const rock = getRadioEqualizerPreset('rock').bandGains;
    const nearRock = rock.map((gain, index) => (index === 0 ? gain + 1 : gain));

    expect(
      resolveRadioEqualizerBandGainsMatch({
        bandGains: nearRock,
        customPresets: [],
        activePresetId: null,
        activeCustomSlot: null,
      })
    ).toEqual({
      kind: 'near',
      label: 'Rock',
      presetId: 'rock',
      customSlot: null,
    });
  });

  test('when exact and near matches are both possible, exact wins', () => {
    const flat = getRadioEqualizerPreset('flat').bandGains;

    expect(isRadioEqualizerBandGainsExactMatch(flat, flat)).toBe(true);
    expect(
      resolveRadioEqualizerBandGainsMatch({
        bandGains: [...flat],
        customPresets: [],
        activePresetId: 'bass-boost',
        activeCustomSlot: null,
      })?.kind
    ).toBe('exact');
  });
});

describe('radioEqualizerLastSelection', () => {
  test('when storage has no last selection, the active preset becomes the reset target', () => {
    expect(
      normalizeRadioEqualizerLastSelection({
        lastSelection: undefined,
        presetId: 'jazz',
        customPresetSlot: null,
      })
    ).toEqual({
      source: 'preset',
      presetId: 'jazz',
    });
  });
});
