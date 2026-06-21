import {
  DEFAULT_BAR_VISUALIZER_PREFERENCES,
  loadBarVisualizerPreferences,
  saveBarVisualizerPreferences,
} from './barVisualizerPreferences';

describe('barVisualizerPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns defaults when storage is empty', () => {
    expect(loadBarVisualizerPreferences()).toEqual(DEFAULT_BAR_VISUALIZER_PREFERENCES);
  });

  test('persists valid preferences', () => {
    saveBarVisualizerPreferences({
      presetId: 'wave',
      density: 'wide',
    });

    expect(loadBarVisualizerPreferences()).toEqual({
      presetId: 'wave',
      density: 'wide',
    });
  });
});
