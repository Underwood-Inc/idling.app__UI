import {
  detectWebglVisualizerCapability,
  resetWebglVisualizerCapabilityCacheForTests,
} from './detectWebglVisualizerCapability';

describe('detectWebglVisualizerCapability', () => {
  beforeEach(() => {
    resetWebglVisualizerCapabilityCacheForTests();
  });

  test('when WebGL2 is unavailable, capability reports unsupported with a reason', () => {
    const capability = detectWebglVisualizerCapability();

    expect(capability.isSupported).toBe(false);
    expect(capability.reason).toMatch(/WebGL2/i);
  });
});
