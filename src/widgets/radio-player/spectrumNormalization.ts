import type { SpectrumNormalizer, SpectrumNormalizerOptions } from './spectrumNormalization.types';

const DEFAULT_PEAK_DECAY = 0.994;
const DEFAULT_NOISE_FLOOR = 0.03;
const DEFAULT_MIN_PEAK = 0.06;
const DEFAULT_TREBLE_BOOST = 1.85;

interface LogBinRange {
  start: number;
  end: number;
}

/** Log-spaced bin range for a bar index (music-oriented spectrum mapping). */
function getLogBinRange(barIndex: number, barCount: number, binCount: number): LogBinRange {
  if (binCount <= 1) {
    return { start: 0, end: 1 };
  }

  const logMin = Math.log(1);
  const logMax = Math.log(binCount);
  const startRatio = barIndex / barCount;
  const endRatio = (barIndex + 1) / barCount;

  const start = Math.min(
    binCount - 1,
    Math.max(0, Math.floor(Math.exp(logMin + (logMax - logMin) * startRatio)) - 1)
  );
  const end = Math.min(
    binCount,
    Math.max(start + 1, Math.ceil(Math.exp(logMin + (logMax - logMin) * endRatio)))
  );

  return { start, end };
}

/** Peak-hold auto-gain normalizer — each bar scales to its recent maximum. */
export function createSpectrumNormalizer(
  barCount: number,
  options: SpectrumNormalizerOptions = {}
): SpectrumNormalizer {
  const peakDecay = options.peakDecay ?? DEFAULT_PEAK_DECAY;
  const noiseFloor = options.noiseFloor ?? DEFAULT_NOISE_FLOOR;
  const minPeak = options.minPeak ?? DEFAULT_MIN_PEAK;
  const trebleBoost = options.trebleBoost ?? DEFAULT_TREBLE_BOOST;
  const peaks = new Float32Array(barCount);

  return {
    normalize(frequencyData) {
      const binCount = frequencyData.length;
      const output = new Float32Array(barCount);

      for (let bar = 0; bar < barCount; bar += 1) {
        const { start, end } = getLogBinRange(bar, barCount, binCount);

        let maxVal = 0;
        for (let bin = start; bin < end; bin += 1) {
          maxVal = Math.max(maxVal, frequencyData[bin] ?? 0);
        }

        const bandPosition = barCount <= 1 ? 0 : bar / (barCount - 1);
        const compensation = 1 + bandPosition * trebleBoost;
        let level = (maxVal / 255) * compensation;

        peaks[bar] = Math.max(level, peaks[bar] * peakDecay);
        const scale = Math.max(peaks[bar], minPeak);
        level = Math.min(1, level / scale);

        output[bar] = level < noiseFloor ? 0 : level;
      }

      return output;
    },
    reset() {
      peaks.fill(0);
    },
  };
}
