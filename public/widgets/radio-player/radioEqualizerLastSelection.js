import { isRadioEqualizerCustomSlot } from './radioEqualizerCustomPresets';
import { getRadioEqualizerPreset, isRadioEqualizerPresetId } from './radioEqualizerPresets';
export function createRadioEqualizerLastSelectionFromPreset(presetId) {
    return { source: 'preset', presetId };
}
export function createRadioEqualizerLastSelectionFromCustom(customSlot) {
    return { source: 'custom', customSlot };
}
export function normalizeRadioEqualizerLastSelection({ lastSelection, presetId, customPresetSlot, fallbackPresetId = 'flat', }) {
    if (lastSelection && typeof lastSelection === 'object') {
        const record = lastSelection;
        if (record.source === 'custom' &&
            isRadioEqualizerCustomSlot(record.customSlot)) {
            return createRadioEqualizerLastSelectionFromCustom(record.customSlot);
        }
        if (record.source === 'preset' &&
            isRadioEqualizerPresetId(record.presetId)) {
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
export function resolveRadioEqualizerLastSelectionLabel(lastSelection, customPresetLabels) {
    if (lastSelection.source === 'custom') {
        return customPresetLabels.get(lastSelection.customSlot) ?? `Custom ${lastSelection.customSlot}`;
    }
    return getRadioEqualizerPreset(lastSelection.presetId).label;
}
