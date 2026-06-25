import { describe, expect, test } from 'vitest';
import {
  buildSpectrumGradientSetOptions,
  normalizeRadioSpectrumGradientOverrides,
  resolveSpectrumGradientForPreset,
} from './radioVisualizerSpectrumColors';

describe('radioVisualizerSpectrumColors', () => {
  test('resolveSpectrumGradientForPreset uses brand defaults when no override is saved', () => {
    expect(resolveSpectrumGradientForPreset('led-orangered', {})).toBe('idling-ember');
    expect(resolveSpectrumGradientForPreset('graph-steel', {})).toBe('idling-gold');
    expect(resolveSpectrumGradientForPreset('mirror-rainbow', {})).toBe('idling-teal');
  });

  test('resolveSpectrumGradientForPreset prefers saved overrides', () => {
    expect(
      resolveSpectrumGradientForPreset('graph-steel', {
        'graph-steel': 'idling-violet',
      })
    ).toBe('idling-violet');
  });

  test('buildSpectrumGradientSetOptions keeps dual-channel split on the default gold preset', () => {
    expect(buildSpectrumGradientSetOptions('dual-steel-prism', 'idling-gold')).toEqual({
      gradient: 'idling-gold',
      gradientLeft: 'idling-gold',
      gradientRight: 'idling-teal',
    });
  });

  test('buildSpectrumGradientSetOptions mirrors a custom pick across dual channels', () => {
    expect(buildSpectrumGradientSetOptions('dual-steel-prism', 'idling-violet')).toEqual({
      gradient: 'idling-violet',
      gradientLeft: 'idling-violet',
      gradientRight: 'idling-violet',
    });
  });

  test('normalizeRadioSpectrumGradientOverrides keeps only registered gradients', () => {
    expect(
      normalizeRadioSpectrumGradientOverrides({
        'graph-steel': 'idling-gold',
        'led-orangered': 'not-a-gradient',
      })
    ).toEqual({
      'graph-steel': 'idling-gold',
    });
  });
});
