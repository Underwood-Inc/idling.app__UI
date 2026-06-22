import {
  resolveRadioFullscreenSensitivity,
  type RadioFullscreenSensitivityRange,
} from './radioFullscreenVisualizerDisplay';

export interface RadioSpectrumPeakAutoGainState {
  rollingPeak: number;
}

export interface RadioSpectrumPeakAutoGainOptions {
  peakDecay?: number;
  minRollingPeak?: number;
}

export interface TickRadioSpectrumPeakAutoGainInput {
  frequencyData: Uint8Array;
  state: RadioSpectrumPeakAutoGainState;
  peakDecay?: number;
  minRollingPeak?: number;
}

export interface TickRadioSpectrumPeakAutoGainResult {
  state: RadioSpectrumPeakAutoGainState;
  framePeak: number;
}

export function createRadioSpectrumPeakAutoGainState(): RadioSpectrumPeakAutoGainState {
  return { rollingPeak: 0 };
}

/** Track recent peak energy (0–1) from raw FFT bytes — mirrors dock bar normalizer intent. */
export function tickRadioSpectrumPeakAutoGain({
  frequencyData,
  state,
  peakDecay = 0.992,
  minRollingPeak = 0.06,
}: TickRadioSpectrumPeakAutoGainInput): TickRadioSpectrumPeakAutoGainResult {
  let framePeak = 0;

  for (let index = 0; index < frequencyData.length; index += 1) {
    framePeak = Math.max(framePeak, (frequencyData[index] ?? 0) / 255);
  }

  const rollingPeak = Math.max(framePeak, state.rollingPeak * peakDecay, minRollingPeak);

  return {
    state: { rollingPeak },
    framePeak,
  };
}

export interface ResolveRadioSpectrumPeakSensitivityInput {
  spectrumBarHeight: number;
  rollingPeak: number;
  baseMinDecibels?: number;
  baseMaxDecibels?: number;
}

/** Blend bar-height sensitivity with rolling peak auto-gain for quiet/loud streams. */
export function resolveRadioSpectrumPeakSensitivity({
  spectrumBarHeight,
  rollingPeak,
  baseMinDecibels = -88,
  baseMaxDecibels = -22,
}: ResolveRadioSpectrumPeakSensitivityInput): RadioFullscreenSensitivityRange {
  const base = resolveRadioFullscreenSensitivity({
    spectrumBarHeight,
    baseMinDecibels,
    baseMaxDecibels,
  });
  const peak = Math.max(0.06, Math.min(1, rollingPeak));
  const quietFactor = Math.max(0, 1 - peak / 0.42);
  const extraMin = quietFactor * 22;
  const extraMax = quietFactor * 6;

  return {
    minDecibels: Math.max(-100, base.minDecibels - extraMin),
    maxDecibels: Math.min(-6, base.maxDecibels + extraMax),
  };
}
