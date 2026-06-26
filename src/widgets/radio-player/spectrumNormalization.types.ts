export type SpectrumNormalizerMode = 'per-bar-peak' | 'frame-peak';

export interface SpectrumNormalizerOptions {
  peakDecay?: number;
  noiseFloor?: number;
  minPeak?: number;
  trebleBoost?: number;
  mode?: SpectrumNormalizerMode;
}

export interface SpectrumNormalizer {
  normalize: (frequencyData: Uint8Array, deltaSeconds?: number) => Float32Array;
  reset: () => void;
}
