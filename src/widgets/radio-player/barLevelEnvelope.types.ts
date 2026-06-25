export interface BarLevelEnvelopeOptions {
  attackSeconds?: number;
  releaseSeconds?: number;
}

export interface BarLevelEnvelope {
  levels: Float32Array;
  smooth: (targets: Float32Array, deltaSeconds: number) => Float32Array;
  resize: (count: number) => void;
  reset: () => void;
}

export interface BuildFrequencyBarTargetsInput {
  frequencyData: Uint8Array;
  barCount: number;
  power: number;
  sampleAt: (data: Uint8Array, normalizedX: number) => number;
}
