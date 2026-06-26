import {
  getWebglVisualizerPresetDefinition,
  normalizeWebglVisualizerPresetId,
  WEBGL_DEFAULT_PRESET_ID,
  WEBGL_VISUALIZER_PRESETS,
} from './webglVisualizerPresets';

describe('webglVisualizerPresets', () => {
  test('when the catalog is listed, every preset exposes a renderer factory', () => {
    WEBGL_VISUALIZER_PRESETS.forEach((preset) => {
      expect(typeof preset.createRenderer).toBe('function');
      expect(getWebglVisualizerPresetDefinition(preset.id).id).toBe(preset.id);
    });
  });

  test('when an unknown preset id is requested, spectrum bars is used', () => {
    expect(normalizeWebglVisualizerPresetId('legacy-glow')).toBe(WEBGL_DEFAULT_PRESET_ID);
    expect(getWebglVisualizerPresetDefinition('legacy-glow').id).toBe('spectrum-bars');
  });

  test('when a legacy preset id is stored, it maps to the closest renderer archetype', () => {
    expect(normalizeWebglVisualizerPresetId('aurora-flow')).toBe('spectrum-bars');
    expect(normalizeWebglVisualizerPresetId('nebula-chamber')).toBe('liquid-merge');
    expect(normalizeWebglVisualizerPresetId('lissajous-glow')).toBe('waveform-path');
    expect(normalizeWebglVisualizerPresetId('constellation-weave')).toBe('neon-constellation');
    expect(normalizeWebglVisualizerPresetId('kaleidoscope-prism')).toBe('neon-constellation');
    expect(normalizeWebglVisualizerPresetId('plasma')).toBe('netrunner-grid');
    expect(normalizeWebglVisualizerPresetId('plasma-wave')).toBe('netrunner-grid');
    expect(normalizeWebglVisualizerPresetId('liquid-merge')).toBe('liquid-merge');
    expect(normalizeWebglVisualizerPresetId('bar-city')).toBe('netrunner-grid');
    expect(normalizeWebglVisualizerPresetId('hex-lattice')).toBe('spectrum-bars');
    expect(normalizeWebglVisualizerPresetId('circuit-matrix')).toBe('spectrum-bars');
    expect(normalizeWebglVisualizerPresetId('cyber-tunnel')).toBe('netrunner-grid');
    expect(normalizeWebglVisualizerPresetId('cyber-tunnel-extreme')).toBe('spectrum-bars');
    expect(normalizeWebglVisualizerPresetId('netrunner-grid-extreme')).toBe('spectrum-bars');
    expect(normalizeWebglVisualizerPresetId('neon-cube-avenue')).toBe('spectrum-bars');
    expect(normalizeWebglVisualizerPresetId('ripple-pool')).toBe('starry-horizon');
    expect(normalizeWebglVisualizerPresetId('mirror-lake')).toBe('starry-horizon');
    expect(normalizeWebglVisualizerPresetId('eq-horizon')).toBe('starry-horizon');
    expect(normalizeWebglVisualizerPresetId('starry-horizon')).toBe('starry-horizon');
    expect(normalizeWebglVisualizerPresetId('spectrum-bloom')).toBe('radial-spectrum');
    expect(normalizeWebglVisualizerPresetId('waveform-scope')).toBe('waveform-path');
    expect(normalizeWebglVisualizerPresetId('particle-orbit')).toBe('neon-constellation');
    expect(normalizeWebglVisualizerPresetId('radial-bars')).toBe('radial-spectrum');
    expect(normalizeWebglVisualizerPresetId('mirror-bars')).toBe('mirror-bars');
  });
});
