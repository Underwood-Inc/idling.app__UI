import { isRadioEqualizerCustomPresetSaved } from './radioEqualizerCustomPresets';
import {
  RADIO_EQUALIZER_BAND_COUNT,
  RADIO_EQUALIZER_PRESET_DEFINITIONS,
} from './radioEqualizerPresets';
import type {
  RadioEqualizerBandGains,
  RadioEqualizerBandGainsMatch,
  RadioEqualizerCustomPreset,
  RadioEqualizerCustomSlot,
  RadioEqualizerMatchKind,
  RadioEqualizerPresetId,
} from './radioEqualizer.types';

export interface RadioEqualizerBandGainsMatchInput {
  bandGains: RadioEqualizerBandGains;
  customPresets: readonly RadioEqualizerCustomPreset[];
  activePresetId: RadioEqualizerPresetId | null;
  activeCustomSlot: RadioEqualizerCustomSlot | null;
}

export interface RadioEqualizerMatchThresholds {
  exactMaxDelta: number;
  nearMaxDelta: number;
}

export const RADIO_EQUALIZER_MATCH_THRESHOLDS: RadioEqualizerMatchThresholds = {
  exactMaxDelta: 0.001,
  nearMaxDelta: 1.5,
};

export interface RadioEqualizerMatchCandidate {
  kind: RadioEqualizerMatchKind;
  label: string;
  presetId: RadioEqualizerPresetId | null;
  customSlot: RadioEqualizerCustomSlot | null;
  maxDelta: number;
  totalDelta: number;
}

export function measureRadioEqualizerBandDelta(
  left: readonly number[],
  right: readonly number[]
): { maxDelta: number; totalDelta: number } {
  let maxDelta = 0;
  let totalDelta = 0;

  for (let index = 0; index < RADIO_EQUALIZER_BAND_COUNT; index += 1) {
    const delta = Math.abs((left[index] ?? 0) - (right[index] ?? 0));
    maxDelta = Math.max(maxDelta, delta);
    totalDelta += delta;
  }

  return { maxDelta, totalDelta };
}

export function isRadioEqualizerBandGainsExactMatch(
  left: readonly number[],
  right: readonly number[],
  exactMaxDelta = RADIO_EQUALIZER_MATCH_THRESHOLDS.exactMaxDelta
): boolean {
  return measureRadioEqualizerBandDelta(left, right).maxDelta <= exactMaxDelta;
}

function isActiveEqualizerMatch(
  candidate: Pick<RadioEqualizerMatchCandidate, 'presetId' | 'customSlot'>,
  activePresetId: RadioEqualizerPresetId | null,
  activeCustomSlot: RadioEqualizerCustomSlot | null
): boolean {
  if (candidate.customSlot !== null) {
    return activeCustomSlot === candidate.customSlot;
  }

  return candidate.presetId !== null && activePresetId === candidate.presetId && activeCustomSlot === null;
}

function listRadioEqualizerMatchCandidates(
  bandGains: RadioEqualizerBandGains,
  customPresets: readonly RadioEqualizerCustomPreset[]
): RadioEqualizerMatchCandidate[] {
  const candidates: RadioEqualizerMatchCandidate[] = [];

  for (const preset of RADIO_EQUALIZER_PRESET_DEFINITIONS) {
    const { maxDelta, totalDelta } = measureRadioEqualizerBandDelta(bandGains, preset.bandGains);
    candidates.push({
      kind: maxDelta <= RADIO_EQUALIZER_MATCH_THRESHOLDS.exactMaxDelta ? 'exact' : 'near',
      label: preset.label,
      presetId: preset.id,
      customSlot: null,
      maxDelta,
      totalDelta,
    });
  }

  for (const preset of customPresets) {
    if (!isRadioEqualizerCustomPresetSaved(preset)) {
      continue;
    }

    const { maxDelta, totalDelta } = measureRadioEqualizerBandDelta(bandGains, preset.bandGains);
    candidates.push({
      kind: maxDelta <= RADIO_EQUALIZER_MATCH_THRESHOLDS.exactMaxDelta ? 'exact' : 'near',
      label: preset.label,
      presetId: null,
      customSlot: preset.slot,
      maxDelta,
      totalDelta,
    });
  }

  return candidates;
}

function pickBestCandidate(
  candidates: RadioEqualizerMatchCandidate[],
  kind: RadioEqualizerMatchKind
): RadioEqualizerMatchCandidate | null {
  const filtered = candidates.filter((candidate) => candidate.kind === kind);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.sort((left, right) => {
    if (left.maxDelta !== right.maxDelta) {
      return left.maxDelta - right.maxDelta;
    }

    return left.totalDelta - right.totalDelta;
  })[0];
}

export function resolveRadioEqualizerBandGainsMatch({
  bandGains,
  customPresets,
  activePresetId,
  activeCustomSlot,
}: RadioEqualizerBandGainsMatchInput): RadioEqualizerBandGainsMatch | null {
  const candidates = listRadioEqualizerMatchCandidates(bandGains, customPresets).map((candidate) => {
    const kind =
      candidate.maxDelta <= RADIO_EQUALIZER_MATCH_THRESHOLDS.exactMaxDelta
        ? 'exact'
        : candidate.maxDelta <= RADIO_EQUALIZER_MATCH_THRESHOLDS.nearMaxDelta
          ? 'near'
          : null;

    if (!kind) {
      return null;
    }

    return { ...candidate, kind };
  }).filter((candidate): candidate is RadioEqualizerMatchCandidate => candidate !== null);

  const exact = pickBestCandidate(candidates, 'exact');
  if (exact && !isActiveEqualizerMatch(exact, activePresetId, activeCustomSlot)) {
    return {
      kind: 'exact',
      label: exact.label,
      presetId: exact.presetId,
      customSlot: exact.customSlot,
    };
  }

  const near = pickBestCandidate(candidates, 'near');
  if (
    near &&
    near.maxDelta > RADIO_EQUALIZER_MATCH_THRESHOLDS.exactMaxDelta &&
    !isActiveEqualizerMatch(near, activePresetId, activeCustomSlot)
  ) {
    return {
      kind: 'near',
      label: near.label,
      presetId: near.presetId,
      customSlot: near.customSlot,
    };
  }

  return null;
}
