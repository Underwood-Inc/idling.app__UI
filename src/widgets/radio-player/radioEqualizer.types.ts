export type RadioEqualizerCustomSlot = 1 | 2 | 3;

export type RadioEqualizerPresetId =
  | 'flat'
  | 'bass-boost'
  | 'treble-boost'
  | 'vocal'
  | 'rock'
  | 'jazz'
  | 'electronic'
  | 'podcast';

export type RadioEqualizerBandGains = readonly number[];

export interface RadioEqualizerCustomPreset {
  slot: RadioEqualizerCustomSlot;
  label: string;
  bandGains: number[];
  savedAt: number | null;
}

export interface RadioEqualizerSettings {
  presetId: RadioEqualizerPresetId | null;
  customPresetSlot: RadioEqualizerCustomSlot | null;
  bandGains: RadioEqualizerBandGains;
  customPresets: RadioEqualizerCustomPreset[];
  /** Last preset or custom slot applied — used by Reset. */
  lastSelection: RadioEqualizerLastSelection;
}

export interface RadioEqualizerLastSelectionPreset {
  source: 'preset';
  presetId: RadioEqualizerPresetId;
}

export interface RadioEqualizerLastSelectionCustom {
  source: 'custom';
  customSlot: RadioEqualizerCustomSlot;
}

export type RadioEqualizerLastSelection =
  | RadioEqualizerLastSelectionPreset
  | RadioEqualizerLastSelectionCustom;

export type RadioEqualizerMatchKind = 'exact' | 'near';

export interface RadioEqualizerBandGainsMatch {
  kind: RadioEqualizerMatchKind;
  label: string;
  presetId: RadioEqualizerPresetId | null;
  customSlot: RadioEqualizerCustomSlot | null;
}

export interface RadioEqualizerPresetDefinition {
  id: RadioEqualizerPresetId;
  label: string;
  bandGains: RadioEqualizerBandGains;
}

export interface RadioEqualizerSettingsRecord {
  id: 'active';
  presetId: RadioEqualizerPresetId | null;
  customPresetSlot: RadioEqualizerCustomSlot | null;
  bandGains: number[];
  customPresets: RadioEqualizerCustomPreset[];
  lastSelection?: RadioEqualizerLastSelection;
  updatedAt: number;
}

export interface RadioEqualizerChain {
  input: AudioNode;
  output: AudioNode;
  setBandGains: (bandGains: readonly number[]) => void;
  disconnect: () => void;
}
