import {
  buildStarryHorizonFragmentShader,
  resolveStarryHorizonBarColor,
  resolveStarryHorizonBarTone,
  STARRY_HORIZON_BAR_COUNT,
  STARRY_HORIZON_STAR_TONES,
} from './createStarryHorizonRenderer';

describe('createStarryHorizonRenderer', () => {
  test('when the fragment shader is built, water is present and stars are rendered via DOM not GLSL', () => {
    const source = buildStarryHorizonFragmentShader(STARRY_HORIZON_BAR_COUNT);
    const tonesIndex = source.indexOf('void ambientStarTones');
    const waterIndex = source.indexOf('vec3 sampleWater');

    expect(tonesIndex).toBeGreaterThan(-1);
    expect(waterIndex).toBeGreaterThan(-1);
    expect(source).toContain('sampleReflectedSky');
    expect(source).not.toContain('sampleAmbientStarfield');
    expect(source).not.toContain('sampleSkyStars');
  });

  test('when the shader is built, EQ bar count matches other spectrum presets', () => {
    expect(STARRY_HORIZON_BAR_COUNT).toBe(64);
  });

  test('when bar level nears peak, color shifts from core toward star flare tones', () => {
    const barIndex = 12;
    const tone = STARRY_HORIZON_STAR_TONES[resolveStarryHorizonBarTone(barIndex)];
    const quiet = resolveStarryHorizonBarColor({ barIndex, level: 0.08 });
    const peak = resolveStarryHorizonBarColor({ barIndex, level: 0.95 });

    expect(peak[0] + peak[1] + peak[2]).toBeGreaterThan(quiet[0] + quiet[1] + quiet[2]);
    expect(peak[0]).toBeGreaterThan(tone.core[0] * 0.4);
  });

  test('when bar level is low, neighboring bars can share a tone but differ in brightness', () => {
    const left = resolveStarryHorizonBarColor({ barIndex: 4, level: 0.12 });
    const right = resolveStarryHorizonBarColor({ barIndex: 40, level: 0.12 });

    expect(left[0] + left[1] + left[2]).toBeLessThan(0.9);
    expect(right[0] + right[1] + right[2]).toBeLessThan(0.9);
  });
});
