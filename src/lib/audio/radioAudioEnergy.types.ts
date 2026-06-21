export interface RadioAudioEnergyBands {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
}

export interface ComputeRadioAudioEnergyInput {
  frequencyData: Uint8Array;
}

export interface SmoothRadioAudioEnergyInput {
  current: RadioAudioEnergyBands;
  target: RadioAudioEnergyBands;
  attack: number;
  release: number;
}
