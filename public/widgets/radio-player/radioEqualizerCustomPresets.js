import { RADIO_EQUALIZER_BAND_COUNT, normalizeRadioEqualizerBandGains } from './radioEqualizerPresets';
export const RADIO_EQUALIZER_CUSTOM_SLOT_COUNT = 3;
export const RADIO_EQUALIZER_CUSTOM_SLOTS = [1, 2, 3];
export const RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH = 32;
export function normalizeRadioEqualizerCustomPresetLabel(label, slot) {
    const trimmed = label.trim();
    if (!trimmed) {
        return `Custom ${slot}`;
    }
    return trimmed.slice(0, RADIO_EQUALIZER_CUSTOM_PRESET_LABEL_MAX_LENGTH);
}
export function createEmptyRadioEqualizerCustomPreset(slot) {
    return {
        slot,
        label: `Custom ${slot}`,
        bandGains: Array.from({ length: RADIO_EQUALIZER_BAND_COUNT }, () => 0),
        savedAt: null,
    };
}
export function createEmptyRadioEqualizerCustomPresets() {
    return RADIO_EQUALIZER_CUSTOM_SLOTS.map((slot) => createEmptyRadioEqualizerCustomPreset(slot));
}
export function isRadioEqualizerCustomSlot(value) {
    return value === 1 || value === 2 || value === 3;
}
export function normalizeRadioEqualizerCustomPresets(value) {
    const defaults = createEmptyRadioEqualizerCustomPresets();
    if (!Array.isArray(value)) {
        return defaults;
    }
    return defaults.map((defaultPreset) => {
        const match = value.find((entry) => {
            if (!entry || typeof entry !== 'object') {
                return false;
            }
            return entry.slot === defaultPreset.slot;
        });
        if (!match) {
            return defaultPreset;
        }
        const label = normalizeRadioEqualizerCustomPresetLabel(typeof match.label === 'string' ? match.label : defaultPreset.label, defaultPreset.slot);
        const savedAt = typeof match.savedAt === 'number' ? match.savedAt : null;
        if (savedAt === null) {
            return defaultPreset;
        }
        return {
            slot: defaultPreset.slot,
            label,
            bandGains: [...normalizeRadioEqualizerBandGains(Array.isArray(match.bandGains) ? match.bandGains : [])],
            savedAt,
        };
    });
}
export function isRadioEqualizerCustomPresetSaved(preset) {
    return preset.savedAt !== null;
}
export function getRadioEqualizerCustomPresetLabel(presets, slot) {
    return presets.find((preset) => preset.slot === slot)?.label ?? `Custom ${slot}`;
}
export function replaceRadioEqualizerCustomPreset(presets, slot, nextPreset) {
    return presets.map((preset) => (preset.slot === slot ? nextPreset : preset));
}
export function deleteRadioEqualizerCustomPresetEntry(presets, slot) {
    return replaceRadioEqualizerCustomPreset(presets, slot, createEmptyRadioEqualizerCustomPreset(slot));
}
