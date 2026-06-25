import {
  BAR_GAP_BY_DENSITY,
  BAR_SLOT_WIDTH_BY_DENSITY,
  DEFAULT_BAR_VISUALIZER_PREFERENCES,
  loadBarVisualizerPreferences,
  resolveBarCountForCanvas,
  resolveBarGapForDensity,
  resolveBarVisualizerPresetForSurface,
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

  test('persists dock preset, wave style, and enabled flag together', () => {
    saveBarVisualizerPreferences({
      presetId: 'arc',
      dockPresetId: 'idling-bars',
      density: 'wide',
      enabled: false,
      waveStyle: 'ribbon',
      barFill: 'glass',
    });

    expect(loadBarVisualizerPreferences()).toEqual({
      presetId: 'arc',
      dockPresetId: 'idling-bars',
      density: 'wide',
      enabled: false,
      waveStyle: 'ribbon',
      colorPalette: 'theme',
      barFill: 'glass',
      barTrail: 'none',
      glow: 'off',
      scopeSmoothing: 0.62,
    });
  });

  test('when glass was saved as a preset, frequency bars keep a glass fill option', () => {
    localStorage.setItem(
      'idling-radio-player-viz-prefs',
      JSON.stringify({ presetId: 'glass', density: 'normal', enabled: true })
    );

    expect(loadBarVisualizerPreferences()).toEqual({
      presetId: 'idling-bars',
      dockPresetId: 'idling-bars',
      density: 'normal',
      enabled: true,
      waveStyle: 'line',
      colorPalette: 'theme',
      barFill: 'glass',
      barTrail: 'none',
      glow: 'off',
      scopeSmoothing: 0.62,
    });
  });

  test('when prism was saved as a preset, it migrates to idling bars with prism colors', () => {
    localStorage.setItem(
      'idling-radio-player-viz-prefs',
      JSON.stringify({ presetId: 'prism', density: 'normal', enabled: true })
    );

    expect(loadBarVisualizerPreferences()).toEqual({
      presetId: 'idling-bars',
      dockPresetId: 'idling-bars',
      density: 'normal',
      enabled: true,
      waveStyle: 'line',
      colorPalette: 'prism',
      barFill: 'solid',
      barTrail: 'none',
      glow: 'off',
      scopeSmoothing: 0.62,
    });
  });

  test('when legacy storage used a removed preset, preferences migrate to wave', () => {
    localStorage.setItem(
      'idling-radio-player-viz-prefs',
      JSON.stringify({ presetId: 'aurora', density: 'normal', enabled: true })
    );

    expect(loadBarVisualizerPreferences()).toMatchObject({
      presetId: 'wave',
      dockPresetId: 'wave',
      waveStyle: 'line',
    });
  });

  test('when ribbon was saved as a preset, wave style becomes ribbon', () => {
    localStorage.setItem(
      'idling-radio-player-viz-prefs',
      JSON.stringify({ presetId: 'ribbon', density: 'normal', enabled: true })
    );

    expect(loadBarVisualizerPreferences()).toMatchObject({
      presetId: 'wave',
      dockPresetId: 'wave',
      waveStyle: 'ribbon',
    });
  });

  test('when the dock renders, fullscreen-only presets never drive the dock canvas', () => {
    expect(
      resolveBarVisualizerPresetForSurface(
        {
          presetId: 'arc',
          dockPresetId: 'idling-bars',
          density: 'normal',
          enabled: true,
          waveStyle: 'line',
          colorPalette: 'theme',
          barFill: 'glass',
          barTrail: 'none',
          glow: 'off',
          scopeSmoothing: 0.62,
        },
        'dock'
      )
    ).toBe('idling-bars');

    expect(
      resolveBarVisualizerPresetForSurface(
        {
          presetId: 'arc',
          dockPresetId: 'idling-bars',
          density: 'normal',
          enabled: true,
          waveStyle: 'line',
          colorPalette: 'theme',
          barFill: 'glass',
          barTrail: 'none',
          glow: 'off',
          scopeSmoothing: 0.62,
        },
        'expanded'
      )
    ).toBe('arc');
  });

  test('when fullscreen renders, dock-only presets never drive the expanded canvas', () => {
    expect(
      resolveBarVisualizerPresetForSurface(
        {
          presetId: 'thread-weave',
          dockPresetId: 'thread-weave',
          density: 'normal',
          enabled: true,
          waveStyle: 'line',
          colorPalette: 'theme',
          barFill: 'solid',
          barTrail: 'none',
          glow: 'off',
          scopeSmoothing: 0.62,
        },
        'expanded'
      )
    ).toBe('wave');

    expect(
      resolveBarVisualizerPresetForSurface(
        {
          presetId: 'thread-weave',
          dockPresetId: 'thread-weave',
          density: 'normal',
          enabled: true,
          waveStyle: 'line',
          colorPalette: 'theme',
          barFill: 'solid',
          barTrail: 'none',
          glow: 'off',
          scopeSmoothing: 0.62,
        },
        'dock'
      )
    ).toBe('thread-weave');
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

  test('keeps density-based bar count for compact fullscreen presets', () => {
    expect(
      resolveBarCountForCanvas({
        density: 'normal',
        canvasWidthPx: 512,
        presetId: 'arc',
      })
    ).toBe(40);
  });

  test('maps density to distinct bar gaps', () => {
    expect(resolveBarGapForDensity('compact')).toBe(BAR_GAP_BY_DENSITY.compact);
    expect(resolveBarGapForDensity('wide')).toBeGreaterThan(resolveBarGapForDensity('compact'));
  });
});

describe('getBarVisualizerDockLayout', () => {
  test('marks arc as a compact dock layout', () => {
    expect(getBarVisualizerDockLayout('arc')).toBe('compact');
    expect(getBarVisualizerDockLayout('peaks')).toBe('wide');
  });
});
