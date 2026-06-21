import {
  DEFAULT_BAR_VISUALIZER_PREFERENCES,
  loadBarVisualizerPreferences,
  resolveBarCountForCanvas,
  saveBarVisualizerPreferences,
} from './barVisualizerPreferences';
import { getBarVisualizerDockLayout } from './barVisualizerPresets';

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

  test('scales bar count with canvas width for wide presets', () => {
    expect(
      resolveBarCountForCanvas({
        density: 'normal',
        canvasWidthPx: 320,
        presetId: 'peaks',
      })
    ).toBe(64);

    expect(
      resolveBarCountForCanvas({
        density: 'normal',
        canvasWidthPx: 512,
        presetId: 'peaks',
      })
    ).toBe(102);
  });

  test('keeps density-based bar count for compact presets', () => {
    expect(
      resolveBarCountForCanvas({
        density: 'normal',
        canvasWidthPx: 512,
        presetId: 'pulse',
      })
    ).toBe(40);
  });
});

describe('getBarVisualizerDockLayout', () => {
  test('marks pulse and arc as compact dock layouts', () => {
    expect(getBarVisualizerDockLayout('pulse')).toBe('compact');
    expect(getBarVisualizerDockLayout('arc')).toBe('compact');
    expect(getBarVisualizerDockLayout('peaks')).toBe('wide');
  });
});
