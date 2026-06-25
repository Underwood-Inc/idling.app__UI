import {
  BAR_VISUALIZER_PRESET_DEFINITIONS,
  createBarVisualizerRuntime,
  getBarVisualizerFullscreenLayout,
  getBarVisualizerPresetDefinition,
  isBarVisualizerCircularPreset,
  isBarVisualizerFullscreenOnly,
  isBarVisualizerDockOnly,
  isScopeVisualizerPreset,
  listBarVisualizerPresetsForSurface,
  normalizeBarVisualizerPresetId,
} from './barVisualizerPresets';

describe('barVisualizerPresets', () => {
  test('when the dock Look menu lists styles, compact fullscreen-only presets stay hidden', () => {
    const dockIds = listBarVisualizerPresetsForSurface('dock').map((preset) => preset.id);
    const expandedIds = listBarVisualizerPresetsForSurface('expanded').map((preset) => preset.id);

    expect(dockIds).not.toContain('arc');
    expect(expandedIds).not.toContain('thread-weave');
    expect(dockIds).toContain('thread-weave');
    expect(expandedIds).toEqual(expect.arrayContaining(['arc']));
  });

  test('when fullscreen layout is resolved, canvas and radial presets map correctly', () => {
    expect(getBarVisualizerFullscreenLayout('drift-mist')).toBe('canvas');
    expect(getBarVisualizerFullscreenLayout('scope')).toBe('strip');
    expect(getBarVisualizerFullscreenLayout('arc')).toBe('hemisphere');
    expect(isBarVisualizerCircularPreset('drift-mist')).toBe(false);
    expect(isBarVisualizerCircularPreset('arc')).toBe(true);
    expect(isScopeVisualizerPreset('scope')).toBe(true);
    expect(isScopeVisualizerPreset('wave')).toBe(false);
  });

  test('when a removed preset id is loaded from storage, it migrates safely', () => {
    expect(normalizeBarVisualizerPresetId('aurora')).toBe('wave');
    expect(normalizeBarVisualizerPresetId('ribbon')).toBe('wave');
    expect(normalizeBarVisualizerPresetId('prism')).toBe('idling-bars');
    expect(normalizeBarVisualizerPresetId('glass')).toBe('idling-bars');
    expect(normalizeBarVisualizerPresetId('ember-field')).toBe('wave');
    expect(normalizeBarVisualizerPresetId('aurora-veil')).toBe('drift-mist');
    expect(normalizeBarVisualizerPresetId('starfall')).toBe('dots');
    expect(normalizeBarVisualizerPresetId('orbit-swarm')).toBe('arc');
    expect(normalizeBarVisualizerPresetId('halo')).toBe('arc');
    expect(normalizeBarVisualizerPresetId('pulse')).toBe('arc');
    expect(normalizeBarVisualizerPresetId('peaks')).toBe('idling-bars');
    expect(isBarVisualizerFullscreenOnly('arc')).toBe(true);
    expect(isBarVisualizerFullscreenOnly('scope')).toBe(false);
    expect(isBarVisualizerDockOnly('thread-weave')).toBe(true);
    expect(isBarVisualizerDockOnly('wave')).toBe(false);
  });

  test('when the catalog grows, every preset keeps a renderer', () => {
    BAR_VISUALIZER_PRESET_DEFINITIONS.forEach((preset) => {
      const runtime = createBarVisualizerRuntime(preset.id, 32);
      expect(runtime.presetId).toBe(preset.id);
    });
  });

  test('when a saved preset id is missing, the player falls back to wave', () => {
    const runtime = createBarVisualizerRuntime('legacy-style', 24);
    expect(runtime.presetId).toBe('wave');
    expect(getBarVisualizerPresetDefinition('legacy-style').id).toBe('wave');
  });
});
