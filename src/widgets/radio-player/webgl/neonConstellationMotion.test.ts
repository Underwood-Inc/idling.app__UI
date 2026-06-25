import {
  NEON_CONSTELLATION_DEFAULT_MOTION_MODE,
  normalizeNeonConstellationMotionMode,
} from './neonConstellationMotion';

describe('neonConstellationMotion', () => {
  test('always normalizes to drift', () => {
    expect(normalizeNeonConstellationMotionMode(undefined)).toBe(NEON_CONSTELLATION_DEFAULT_MOTION_MODE);
    expect(normalizeNeonConstellationMotionMode('weird')).toBe('drift');
    expect(normalizeNeonConstellationMotionMode('pulse')).toBe('drift');
  });
});
