export interface SpectrumNormalizerOptions {
  peakDecay?: number;
  noiseFloor?: number;
  minPeak?: number;
  trebleBoost?: number;
}

export interface SpectrumNormalizer {
  normalize: (frequencyData: Uint8Array, deltaSeconds?: number) => Float32Array;
  reset: () => void;
}
