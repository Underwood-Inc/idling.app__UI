import {
  createDefaultRadioEqualizerBandGains,
  getRadioEqualizerPreset,
  isRadioEqualizerPresetId,
  normalizeRadioEqualizerBandGains,
  RADIO_EQUALIZER_BAND_COUNT,
  RADIO_EQUALIZER_GAIN_RANGE,
} from './radioEqualizerPresets';
import { normalizeRadioEqualizerSettingsRecord } from './radioEqualizerPersistence';

describe('radioEqualizerPresets', () => {
  test('when band gains are normalized, values clamp to the equalizer range and fill all bands', () => {
    const normalized = normalizeRadioEqualizerBandGains([20, -20, 3.2, 1.1]);

    expect(normalized).toHaveLength(RADIO_EQUALIZER_BAND_COUNT);
    expect(normalized[0]).toBe(RADIO_EQUALIZER_GAIN_RANGE.max);
    expect(normalized[1]).toBe(RADIO_EQUALIZER_GAIN_RANGE.min);
    expect(normalized[2]).toBe(3.2);
    expect(normalized[3]).toBe(1.1);
    expect(normalized.slice(4)).toEqual(createDefaultRadioEqualizerBandGains().slice(4));
  });

  test('when preset ids are validated, only known presets pass', () => {
    expect(isRadioEqualizerPresetId('rock')).toBe(true);
    expect(isRadioEqualizerPresetId('unknown')).toBe(false);
  });

  test('when preset definitions are resolved, each preset exposes twelve bands', () => {
    const rock = getRadioEqualizerPreset('rock');
    expect(rock.bandGains).toHaveLength(RADIO_EQUALIZER_BAND_COUNT);
  });
});

describe('radioEqualizerPersistence', () => {
  test('when stored settings are malformed, defaults are restored safely', () => {
    const settings = normalizeRadioEqualizerSettingsRecord({
      presetId: 'not-a-preset',
      bandGains: [99, -99],
    });

    expect(settings.presetId).toBeNull();
    expect(settings.bandGains[0]).toBe(RADIO_EQUALIZER_GAIN_RANGE.max);
    expect(settings.bandGains[1]).toBe(RADIO_EQUALIZER_GAIN_RANGE.min);
    expect(settings.bandGains).toHaveLength(RADIO_EQUALIZER_BAND_COUNT);
  });
});
