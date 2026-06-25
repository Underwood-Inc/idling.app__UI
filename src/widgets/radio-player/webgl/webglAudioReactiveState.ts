import type { WebglAudioReactiveUniforms } from './webglVisualizer.types';

export interface WebglAudioReactiveState extends WebglAudioReactiveUniforms {
  prevEnergy: number;
}

export function createWebglAudioReactiveState(): WebglAudioReactiveState {
  return {
    bass: 0,
    mid: 0,
    treble: 0,
    energy: 0,
    beat: 0,
    prevEnergy: 0,
  };
}

export interface TickWebglAudioReactiveInput {
  frequencyData: Uint8Array;
  state: WebglAudioReactiveState;
  smoothing?: number;
}

export interface TickWebglAudioReactiveResult {
  uniforms: WebglAudioReactiveUniforms;
  state: WebglAudioReactiveState;
}

export function tickWebglAudioReactive({
  frequencyData,
  state,
  smoothing = 0.82,
}: TickWebglAudioReactiveInput): TickWebglAudioReactiveResult {
  const count = frequencyData.length;
  if (count === 0) {
    return { uniforms: state, state };
  }

  const bassEnd = Math.max(1, Math.floor(count * 0.12));
  const midEnd = Math.max(bassEnd + 1, Math.floor(count * 0.45));

  let bassSum = 0;
  let midSum = 0;
  let trebleSum = 0;
  let total = 0;

  for (let index = 0; index < count; index += 1) {
    const sample = (frequencyData[index] ?? 0) / 255;
    total += sample;
    if (index < bassEnd) {
      bassSum += sample;
    } else if (index < midEnd) {
      midSum += sample;
    } else {
      trebleSum += sample;
    }
  }

  const bassRaw = bassSum / bassEnd;
  const midRaw = midSum / Math.max(1, midEnd - bassEnd);
  const trebleRaw = trebleSum / Math.max(1, count - midEnd);
  const energyRaw = total / count;
  const onset = Math.max(0, energyRaw - state.prevEnergy);
  const beatRaw = onset > 0.045 ? Math.min(1, onset * 6.5) : state.beat * 0.9;

  const nextState: WebglAudioReactiveState = {
    bass: state.bass * smoothing + bassRaw * (1 - smoothing),
    mid: state.mid * smoothing + midRaw * (1 - smoothing),
    treble: state.treble * smoothing + trebleRaw * (1 - smoothing),
    energy: state.energy * smoothing + energyRaw * (1 - smoothing),
    beat: state.beat * 0.86 + beatRaw * 0.14,
    prevEnergy: energyRaw,
  };

  return {
    uniforms: {
      bass: nextState.bass,
      mid: nextState.mid,
      treble: nextState.treble,
      energy: nextState.energy,
      beat: nextState.beat,
    },
    state: nextState,
  };
}
