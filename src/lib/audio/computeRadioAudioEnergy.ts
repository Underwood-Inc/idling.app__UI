import type {
  ComputeRadioAudioEnergyInput,
  RadioAudioEnergyBands,
  SmoothRadioAudioEnergyInput,
} from './radioAudioEnergy.types';

function getLogBinRange(barIndex: number, barCount: number, binCount: number): { start: number; end: number } {
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

function averageLogBand(
  frequencyData: Uint8Array,
  bandIndex: number,
  bandCount: number,
  trebleBoost = 0
): number {
  const { start, end } = getLogBinRange(bandIndex, bandCount, frequencyData.length);

  let maxVal = 0;
  for (let index = start; index < end; index += 1) {
    maxVal = Math.max(maxVal, frequencyData[index] ?? 0);
  }

  const bandPosition = bandCount <= 1 ? 0 : bandIndex / (bandCount - 1);
  const compensation = 1 + bandPosition * trebleBoost;

  return (maxVal / 255) * compensation;
}

export function computeRadioAudioEnergy({
  frequencyData,
}: ComputeRadioAudioEnergyInput): RadioAudioEnergyBands {
  const bass = Math.min(1, averageLogBand(frequencyData, 0, 3, 0));
  const mid = Math.min(1, averageLogBand(frequencyData, 1, 3, 0.35));
  const treble = Math.min(1, averageLogBand(frequencyData, 2, 3, 1.2));

  let total = 0;
  for (let index = 0; index < frequencyData.length; index += 1) {
    total += frequencyData[index] ?? 0;
  }

  const energy = total / frequencyData.length / 255;

  return { bass, mid, treble, energy };
}

export function smoothRadioAudioEnergy({
  current,
  target,
  attack,
  release,
}: SmoothRadioAudioEnergyInput): RadioAudioEnergyBands {
  const blend = (from: number, to: number) =>
    from + (to - from) * (to > from ? attack : release);

  return {
    bass: blend(current.bass, target.bass),
    mid: blend(current.mid, target.mid),
    treble: blend(current.treble, target.treble),
    energy: blend(current.energy, target.energy),
  };
}

export const EMPTY_RADIO_AUDIO_ENERGY: RadioAudioEnergyBands = {
  bass: 0,
  mid: 0,
  treble: 0,
  energy: 0,
};

export function applyRadioAudioEnergyToDocument(bands: RadioAudioEnergyBands): void {
  document.documentElement.style.setProperty('--ambient-audio-bass', bands.bass.toFixed(4));
  document.documentElement.style.setProperty('--ambient-audio-mid', bands.mid.toFixed(4));
  document.documentElement.style.setProperty('--ambient-audio-treble', bands.treble.toFixed(4));
  document.documentElement.style.setProperty('--ambient-audio-energy', bands.energy.toFixed(4));
}

export function clearRadioAudioEnergyFromDocument(): void {
  applyRadioAudioEnergyToDocument(EMPTY_RADIO_AUDIO_ENERGY);
}
