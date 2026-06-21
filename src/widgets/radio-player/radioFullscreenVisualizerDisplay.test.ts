import {
  clampRadioFullscreenVisualizerOpacity,
  DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY,
  loadRadioFullscreenVisualizerDisplay,
  normalizeRadioFullscreenVisualizerPresetIndex,
  RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY,
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

  test('returns defaults when storage is empty', () => {
    expect(loadRadioFullscreenVisualizerDisplay()).toEqual(
      DEFAULT_RADIO_FULLSCREEN_VISUALIZER_DISPLAY
    );
  });

  test('persists enabled, opacity, and preset index preferences', () => {
    saveRadioFullscreenVisualizerDisplay({ enabled: false, opacity: 0.4, presetIndex: 2 });

    expect(JSON.parse(localStorage.getItem(RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY) ?? '')).toEqual({
      enabled: false,
      opacity: 0.4,
      presetIndex: 2,
    });
    expect(loadRadioFullscreenVisualizerDisplay()).toEqual({
      enabled: false,
      opacity: 0.4,
      presetIndex: 2,
    });
  });
});
