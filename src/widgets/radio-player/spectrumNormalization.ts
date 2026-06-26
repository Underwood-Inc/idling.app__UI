import type { SpectrumNormalizer, SpectrumNormalizerOptions } from './spectrumNormalization.types';
import { createBarLevelEnvelope } from './barLevelEnvelope';

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

/** Peak-hold auto-gain normalizer with log-spaced FFT bins (canvas bars: per-bar peak; starry horizon: frame peak). */
export function createSpectrumNormalizer(
  barCount: number,
  options: SpectrumNormalizerOptions = {}
): SpectrumNormalizer {
  const peakDecay = options.peakDecay ?? DEFAULT_PEAK_DECAY;
  const noiseFloor = options.noiseFloor ?? DEFAULT_NOISE_FLOOR;
  const minPeak = options.minPeak ?? DEFAULT_MIN_PEAK;
  const mode = options.mode ?? 'per-bar-peak';
  const trebleBoost =
    options.trebleBoost ?? (mode === 'frame-peak' ? 0 : DEFAULT_TREBLE_BOOST);
  const peaks = new Float32Array(barCount);
  const targets = new Float32Array(barCount);
  const displayEnvelope = createBarLevelEnvelope(barCount);
  let framePeak = minPeak;

  const applyNoiseFloor = (target: number): number => {
    if (target < noiseFloor) {
      return (target * target) / Math.max(noiseFloor, 0.001);
    }
    return target;
  };

  return {
    normalize(frequencyData, deltaSeconds = 1 / 60) {
      const binCount = frequencyData.length;
      let frameMax = 0;

      for (let bar = 0; bar < barCount; bar += 1) {
        const { start, end } = getLogBinRange(bar, barCount, binCount);

        let maxVal = 0;
        for (let bin = start; bin < end; bin += 1) {
          maxVal = Math.max(maxVal, frequencyData[bin] ?? 0);
        }

        const bandPosition = barCount <= 1 ? 0 : bar / (barCount - 1);
        const compensation = 1 + bandPosition * trebleBoost;
        const level = (maxVal / 255) * compensation;
        frameMax = Math.max(frameMax, level);
        targets[bar] = level;
      }

      if (mode === 'frame-peak') {
        framePeak = Math.max(frameMax, framePeak * peakDecay, minPeak);
        const scale = Math.max(framePeak, minPeak);

        for (let bar = 0; bar < barCount; bar += 1) {
          let target = Math.min(1, (targets[bar] ?? 0) / scale);
          targets[bar] = applyNoiseFloor(target);
        }

        return displayEnvelope.smooth(targets, deltaSeconds);
      }

      for (let bar = 0; bar < barCount; bar += 1) {
        const level = targets[bar] ?? 0;
        peaks[bar] = Math.max(level, peaks[bar] * peakDecay);
        const scale = Math.max(peaks[bar], minPeak);
        let target = Math.min(1, level / scale);
        targets[bar] = applyNoiseFloor(target);
      }

      return displayEnvelope.smooth(targets, deltaSeconds);
    },
    reset() {
      peaks.fill(0);
      framePeak = minPeak;
      displayEnvelope.reset();
    },
  };
}
