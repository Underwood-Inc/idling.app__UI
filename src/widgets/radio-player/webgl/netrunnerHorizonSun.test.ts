import { describe, expect, test } from 'vitest';
import { resolveNetrunnerSunPalette } from './renderers/createNetrunnerGridRenderer';

describe('netrunnerHorizonSun', () => {
  test('resolveNetrunnerSunPalette blends brand primary and secondary with stronger pulse lift', () => {
    const calm = resolveNetrunnerSunPalette(
      [0.9, 0.76, 0.52],
      [0.45, 0.66, 0.52],
      0
    );
    const pulsed = resolveNetrunnerSunPalette(
      [0.9, 0.76, 0.52],
      [0.45, 0.66, 0.52],
      0.8
    );

    expect(calm.core[0]).toBeGreaterThan(0.5);
    expect(pulsed.core[0]).toBeGreaterThanOrEqual(calm.core[0]);
    expect(pulsed.haze[1]).not.toBe(calm.haze[1]);
  });
});
