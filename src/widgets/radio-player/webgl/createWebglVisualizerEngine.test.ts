import { normalizeWebglVisualizerPresetId } from './webglVisualizerPresets';

describe('createWebglVisualizerEngine integration guards', () => {
  test('when a removed preset id is normalized, liquid merge stays in the catalog', () => {
    expect(normalizeWebglVisualizerPresetId('liquid-merge')).toBe('liquid-merge');
    expect(normalizeWebglVisualizerPresetId('nebula-chamber')).toBe('liquid-merge');
  });

  test('when legacy bar-city is normalized, netrunner grid is used', () => {
    expect(normalizeWebglVisualizerPresetId('bar-city')).toBe('netrunner-grid');
  });
});
