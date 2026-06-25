import { describe, expect, test } from 'vitest';
import { advanceBoundedScrollZ, wrapTrackDepth } from './netrunnerTrackDepth';

describe('netrunnerTrackDepth', () => {
  test('wrapTrackDepth keeps z inside the avenue loop after large scroll offsets', () => {
    const spanZ = 30;
    const trackMin = -spanZ * 0.92;
    const trackMax = spanZ * 0.5;

    const wrapped = wrapTrackDepth({ z: 2400, spanZ });
    expect(wrapped).toBeGreaterThanOrEqual(trackMin);
    expect(wrapped).toBeLessThanOrEqual(trackMax);
  });

  test('advanceBoundedScrollZ wraps scroll offset within spanZ', () => {
    expect(
      advanceBoundedScrollZ({
        current: 29.5,
        increment: 1.2,
        spanZ: 30,
      })
    ).toBeCloseTo(0.7, 5);

    expect(
      advanceBoundedScrollZ({
        current: 10_000,
        increment: 0,
        spanZ: 30,
      })
    ).toBeCloseTo(10, 5);
  });

  test('wrapTrackDepth stays continuous across track-length steps for parallax scroll factors', () => {
    const spanZ = 30;
    const trackMin = -spanZ * 0.92;
    const trackLength = spanZ * 0.5 - trackMin;
    const scrollFactors = [1.15, 1.35, 1.55];

    scrollFactors.forEach((scrollFactor) => {
      const laneT = 0.42;
      const rowZBias = 0.08;
      const baseZ = trackMin + laneT * trackLength + rowZBias;

      const before = wrapTrackDepth({ z: baseZ + 120 * scrollFactor, spanZ });
      const after = wrapTrackDepth({ z: baseZ + 120 * scrollFactor + 0.02 * scrollFactor, spanZ });

      expect(after - before).toBeCloseTo(0.02 * scrollFactor, 4);
    });
  });
});
