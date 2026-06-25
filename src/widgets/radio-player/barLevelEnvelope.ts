import type {
  BarLevelEnvelope,
  BarLevelEnvelopeOptions,
  BuildFrequencyBarTargetsInput,
} from './barLevelEnvelope.types';

export type { BarLevelEnvelope, BarLevelEnvelopeOptions, BuildFrequencyBarTargetsInput };

const DEFAULT_ATTACK_SECONDS = 0.05;
const DEFAULT_RELEASE_SECONDS = 0.48;

function envelopeCoeff(deltaSeconds: number, timeConstantSeconds: number): number {
  return 1 - Math.exp(-deltaSeconds / Math.max(timeConstantSeconds, 0.001));
}

export function buildFrequencyBarTargets(input: BuildFrequencyBarTargetsInput): Float32Array {
  const targets = new Float32Array(input.barCount);
  fillFrequencyBarTargets(targets, input);
  return targets;
}

export function fillFrequencyBarTargets(
  out: Float32Array,
  input: BuildFrequencyBarTargetsInput
): Float32Array {
  const denom = Math.max(1, input.barCount - 1);

  for (let index = 0; index < input.barCount; index += 1) {
    const raw = input.sampleAt(input.frequencyData, index / denom);
    out[index] = Math.pow(raw, input.power);
  }

  return out;
}

export function createBarLevelEnvelope(
  count: number,
  options: BarLevelEnvelopeOptions = {}
): BarLevelEnvelope {
  const attackSeconds = options.attackSeconds ?? DEFAULT_ATTACK_SECONDS;
  const releaseSeconds = options.releaseSeconds ?? DEFAULT_RELEASE_SECONDS;
  let levels = new Float32Array(count);

  return {
    levels,
    smooth(targets, deltaSeconds) {
      const dt = Math.max(0, Math.min(deltaSeconds, 0.05));
      const attack = envelopeCoeff(dt, attackSeconds);
      const release = envelopeCoeff(dt, releaseSeconds);
      const count = Math.min(levels.length, targets.length);

      for (let index = 0; index < count; index += 1) {
        const target = targets[index] ?? 0;
        const current = levels[index] ?? 0;
        const rate = target > current ? attack : release;
        levels[index] = current + (target - current) * rate;
      }

      return levels;
    },
    resize(nextCount) {
      levels = new Float32Array(nextCount);
    },
    reset() {
      levels.fill(0);
    },
  };
}
