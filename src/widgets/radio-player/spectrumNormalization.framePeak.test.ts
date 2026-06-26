import { createSpectrumNormalizer } from './spectrumNormalization';

describe('createSpectrumNormalizer frame-peak mode', () => {
  test('when bass dominates the spectrum, bar heights stay differentiated instead of all pegging full', () => {
    const frequencyData = new Uint8Array(128);
    frequencyData.fill(20);
    for (let index = 0; index < 20; index += 1) {
      frequencyData[index] = 200;
    }
    for (let index = 20; index < 45; index += 1) {
      frequencyData[index] = 120;
    }

    const normalizer = createSpectrumNormalizer(64, { mode: 'frame-peak' });
    const levels = normalizer.normalize(frequencyData, 1 / 60);

    const bassAverage =
      levels.slice(0, 16).reduce((sum, level) => sum + level, 0) / 16;
    const trebleAverage =
      levels.slice(48, 64).reduce((sum, level) => sum + level, 0) / 16;

    expect(bassAverage).toBeGreaterThan(trebleAverage);
    expect(trebleAverage).toBeLessThan(0.6);
    expect([...levels].filter((level) => level < 0.5).length).toBeGreaterThan(20);
  });

  test('when the whole spectrum is uniform, bars remain level without a positional ramp', () => {
    const frequencyData = new Uint8Array(128).fill(100);
    const normalizer = createSpectrumNormalizer(64, { mode: 'frame-peak' });
    const levels = normalizer.normalize(frequencyData, 1 / 60);

    const left = levels[8] ?? 0;
    const right = levels[56] ?? 0;
    expect(Math.abs(left - right)).toBeLessThan(0.15);
  });
});
