import { isRadioEqualizerCustomSlot } from './radioEqualizerCustomPresets';
import { getRadioEqualizerPreset, isRadioEqualizerPresetId } from './radioEqualizerPresets';
import type {
  RadioEqualizerCustomSlot,
  RadioEqualizerLastSelection,
  RadioEqualizerPresetId,
} from './radioEqualizer.types';

export interface NormalizeRadioEqualizerLastSelectionInput {
  lastSelection: unknown;
  presetId: RadioEqualizerPresetId | null;
  customPresetSlot: RadioEqualizerCustomSlot | null;
  fallbackPresetId?: RadioEqualizerPresetId;
}

export function createRadioEqualizerLastSelectionFromPreset(
  presetId: RadioEqualizerPresetId
): RadioEqualizerLastSelection {
  return { source: 'preset', presetId };
}

export function createRadioEqualizerLastSelectionFromCustom(
  customSlot: RadioEqualizerCustomSlot
): RadioEqualizerLastSelection {
  return { source: 'custom', customSlot };
}

export function normalizeRadioEqualizerLastSelection({
  lastSelection,
  presetId,
  customPresetSlot,
  fallbackPresetId = 'flat',
}: NormalizeRadioEqualizerLastSelectionInput): RadioEqualizerLastSelection {
  if (lastSelection && typeof lastSelection === 'object') {
    const record = lastSelection as Partial<RadioEqualizerLastSelection>;
    if (
      record.source === 'custom' &&
      isRadioEqualizerCustomSlot(record.customSlot)
    ) {
      return createRadioEqualizerLastSelectionFromCustom(record.customSlot);
    }

    if (
      record.source === 'preset' &&
      isRadioEqualizerPresetId(record.presetId)
    ) {
      return createRadioEqualizerLastSelectionFromPreset(record.presetId);
    }
  }

  if (customPresetSlot !== null) {
    return createRadioEqualizerLastSelectionFromCustom(customPresetSlot);
  }

  if (presetId !== null) {
    return createRadioEqualizerLastSelectionFromPreset(presetId);
  }

  return createRadioEqualizerLastSelectionFromPreset(fallbackPresetId);
}

export function resolveRadioEqualizerLastSelectionLabel(
  lastSelection: RadioEqualizerLastSelection,
  customPresetLabels: ReadonlyMap<RadioEqualizerCustomSlot, string>
): string {
  if (lastSelection.source === 'custom') {
    return customPresetLabels.get(lastSelection.customSlot) ?? `Custom ${lastSelection.customSlot}`;
  }

  return getRadioEqualizerPreset(lastSelection.presetId).label;
}
