import {
  clampRadioFullscreenSpectrumBarHeight,
  clampRadioFullscreenVisualizerOpacity,
  DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY,
  loadRadioFullscreenVisualizerDisplay,
  normalizeRadioFullscreenVisualizerPresetIndex,
  RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY,
  resolveRadioFullscreenBarHeightMultiplier,
  resolveRadioFullscreenLinearBoost,
  resolveRadioFullscreenRadialRadius,
  resolveRadioFullscreenSensitivity,
  resolveRadioFullscreenVisualHeightRatio,
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

  test('clamps spectrum bar height between 0.35 and 1.5', () => {
    expect(clampRadioFullscreenSpectrumBarHeight(0.2)).toBe(0.35);
    expect(clampRadioFullscreenSpectrumBarHeight(3)).toBe(1.5);
    expect(clampRadioFullscreenSpectrumBarHeight(1.25)).toBe(1.25);
  });

  test('maps slider position to a dock-style height ratio of the frame', () => {
    expect(resolveRadioFullscreenVisualHeightRatio(0.35)).toBeCloseTo(0.12, 5);
    expect(resolveRadioFullscreenVisualHeightRatio(1)).toBeCloseTo(0.28, 5);
    expect(resolveRadioFullscreenVisualHeightRatio(1.5)).toBeCloseTo(0.55, 5);
  });

  test('maps slider position to a gentler amplitude multiplier', () => {
    expect(resolveRadioFullscreenBarHeightMultiplier(0.35)).toBeCloseTo(0.45, 5);
    expect(resolveRadioFullscreenBarHeightMultiplier(1)).toBe(1);
    expect(resolveRadioFullscreenBarHeightMultiplier(1.5)).toBeCloseTo(1.15, 5);
  });

  test('boosts linear amplitude from bar height', () => {
    expect(resolveRadioFullscreenLinearBoost(1.45, 1)).toBeCloseTo(1.45 * (0.85 + 0.15), 5);
    expect(resolveRadioFullscreenLinearBoost(1.45, 1.5)).toBeCloseTo(
      1.45 * (0.85 + 1.15 * 0.15),
      5
    );
    expect(resolveRadioFullscreenLinearBoost(1.45, 0.35)).toBeGreaterThan(1);
  });

  test('returns defaults when storage is empty', () => {
    expect(loadRadioFullscreenVisualizerDisplay()).toEqual(
      DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY
    );
  });

  test('persists enabled, source, opacity, preset index, bar height, and webgl preset preferences', () => {
    saveRadioFullscreenVisualizerDisplay({
      enabled: false,
      source: 'webgl',
      opacity: 0.4,
      presetIndex: 2,
      spectrumBarHeight: 1.25,
      webglPresetId: 'nebula-chamber',
      webglConstellationMotion: 'drift',
      spectrumGradientByPreset: { 'graph-steel': 'idling-violet' },
    });

    expect(JSON.parse(localStorage.getItem(RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY) ?? '')).toEqual({
      enabled: false,
      source: 'webgl',
      opacity: 0.4,
      presetIndex: 2,
      spectrumBarHeight: 1.25,
      webglPresetId: 'liquid-merge',
      webglConstellationMotion: 'drift',
      spectrumGradientByPreset: { 'graph-steel': 'idling-violet' },
    });
    expect(loadRadioFullscreenVisualizerDisplay()).toEqual({
      enabled: false,
      source: 'webgl',
      opacity: 0.4,
      presetIndex: 2,
      spectrumBarHeight: 1.25,
      webglPresetId: 'liquid-merge',
      webglConstellationMotion: 'drift',
      spectrumGradientByPreset: { 'graph-steel': 'idling-violet' },
    });
  });

  test('migrates saved pulse constellation motion to drift', () => {
    saveRadioFullscreenVisualizerDisplay({
      ...DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY,
      webglConstellationMotion: 'pulse',
    });

    expect(loadRadioFullscreenVisualizerDisplay().webglConstellationMotion).toBe('drift');
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
        spectrumBarHeight: 1.5,
      })
    ).toBeCloseTo(0.15 / 1.15, 5);
  });

  test('narrows dB range as bar height increases', () => {
    const base = resolveRadioFullscreenSensitivity({ spectrumBarHeight: 1 });
    const tall = resolveRadioFullscreenSensitivity({ spectrumBarHeight: 1.5 });
    const short = resolveRadioFullscreenSensitivity({ spectrumBarHeight: 0.35 });

    expect(tall.maxDecibels - tall.minDecibels).toBeLessThan(base.maxDecibels - base.minDecibels);
    expect(short.maxDecibels - short.minDecibels).toBeGreaterThan(
      base.maxDecibels - base.minDecibels
    );
  });
});
