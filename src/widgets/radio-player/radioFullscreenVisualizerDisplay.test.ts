import {
  clampRadioFullscreenSpectrumBarHeight,
  clampRadioFullscreenVisualizerOpacity,
  DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY,
  loadRadioFullscreenVisualizerDisplay,
  normalizeRadioFullscreenVisualizerPresetIndex,
  RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY,
  resolveRadioFullscreenLinearBoost,
  resolveRadioFullscreenRadialRadius,
  saveRadioFullscreenVisualizerDisplay,
} from './radioFullscreenVisualizerDisplay';

describe('radioFullscreenVisualizerDisplay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('clamps opacity between 0 and 1', () => {
    expect(clampRadioFullscreenVisualizerOpacity(-0.2)).toBe(0);
    expect(clampRadioFullscreenVisualizerOpacity(1.4)).toBe(1);
    expect(clampRadioFullscreenVisualizerOpacity(0.65)).toBe(0.65);
  });

  test('clamps spectrum bar height between 0.5 and 2.5', () => {
    expect(clampRadioFullscreenSpectrumBarHeight(0.2)).toBe(0.5);
    expect(clampRadioFullscreenSpectrumBarHeight(3)).toBe(2.5);
    expect(clampRadioFullscreenSpectrumBarHeight(1.25)).toBe(1.25);
  });

  test('boosts linear amplitude from bar height', () => {
    expect(resolveRadioFullscreenLinearBoost(1.45, 1)).toBe(1.45);
    expect(resolveRadioFullscreenLinearBoost(1.45, 2)).toBe(2.9);
    expect(resolveRadioFullscreenLinearBoost(1.45, 0.5)).toBe(1);
  });

  test('returns defaults when storage is empty', () => {
    expect(loadRadioFullscreenVisualizerDisplay()).toEqual(
      DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY
    );
  });

  test('persists enabled, opacity, preset index, and bar height preferences', () => {
    saveRadioFullscreenVisualizerDisplay({
      enabled: false,
      opacity: 0.4,
      presetIndex: 2,
      spectrumBarHeight: 1.75,
    });

    expect(JSON.parse(localStorage.getItem(RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY) ?? '')).toEqual({
      enabled: false,
      opacity: 0.4,
      presetIndex: 2,
      spectrumBarHeight: 1.75,
    });
    expect(loadRadioFullscreenVisualizerDisplay()).toEqual({
      enabled: false,
      opacity: 0.4,
      presetIndex: 2,
      spectrumBarHeight: 1.75,
    });
  });

  test('tightens radial inner radius for dual-combined fullscreen presets', () => {
    expect(
      resolveRadioFullscreenRadialRadius({
        presetRadius: 0.12,
        channelLayout: 'dual-combined',
        spectrumBarHeight: 1,
      })
    ).toBe(0.12);

    expect(
      resolveRadioFullscreenRadialRadius({
        channelLayout: 'dual-combined',
        spectrumBarHeight: 2,
      })
    ).toBe(0.075);
  });
});
