import {
  BAR_GAP_BY_DENSITY,
  BAR_SLOT_WIDTH_BY_DENSITY,
  DEFAULT_BAR_VISUALIZER_PREFERENCES,
  loadBarVisualizerPreferences,
  resolveBarCountForCanvas,
  resolveBarGapForDensity,
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

  test('persists valid preferences including enabled flag', () => {
    saveBarVisualizerPreferences({
      presetId: 'wave',
      density: 'wide',
      enabled: false,
    });

    expect(loadBarVisualizerPreferences()).toEqual({
      presetId: 'wave',
      density: 'wide',
      enabled: false,
    });
  });

  test('when the dock is wide, compact spacing draws more bars than wide spacing', () => {
    const canvasWidthPx = 280;

    const compactCount = resolveBarCountForCanvas({
      density: 'compact',
      canvasWidthPx,
      presetId: 'peaks',
    });
    const normalCount = resolveBarCountForCanvas({
      density: 'normal',
      canvasWidthPx,
      presetId: 'peaks',
    });
    const wideCount = resolveBarCountForCanvas({
      density: 'wide',
      canvasWidthPx,
      presetId: 'peaks',
    });

    expect(compactCount).toBeGreaterThan(normalCount);
    expect(normalCount).toBeGreaterThan(wideCount);
    expect(compactCount).toBe(Math.round(canvasWidthPx / BAR_SLOT_WIDTH_BY_DENSITY.compact));
    expect(wideCount).toBe(Math.round(canvasWidthPx / BAR_SLOT_WIDTH_BY_DENSITY.wide));
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

  test('maps density to distinct bar gaps', () => {
    expect(resolveBarGapForDensity('compact')).toBe(BAR_GAP_BY_DENSITY.compact);
    expect(resolveBarGapForDensity('wide')).toBeGreaterThan(resolveBarGapForDensity('compact'));
  });
});

describe('getBarVisualizerDockLayout', () => {
  test('marks pulse and arc as compact dock layouts', () => {
    expect(getBarVisualizerDockLayout('pulse')).toBe('compact');
    expect(getBarVisualizerDockLayout('arc')).toBe('compact');
    expect(getBarVisualizerDockLayout('peaks')).toBe('wide');
  });
});
