import { createDefaultRadioEqualizerSettings, isRadioEqualizerPresetId, normalizeRadioEqualizerBandGains, } from './radioEqualizerPresets';
import { isRadioEqualizerCustomSlot, normalizeRadioEqualizerCustomPresets, } from './radioEqualizerCustomPresets';
import { normalizeRadioEqualizerLastSelection } from './radioEqualizerLastSelection';
import { openRadioPlayerIndexedDb } from './radioStationFavoritesIndexedDb';
export const RADIO_EQUALIZER_SETTINGS_STORE_NAME = 'equalizerSettings';
export const RADIO_EQUALIZER_SETTINGS_RECORD_ID = 'active';
function runEqualizerRead(operation) {
    return openRadioPlayerIndexedDb().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(RADIO_EQUALIZER_SETTINGS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(RADIO_EQUALIZER_SETTINGS_STORE_NAME);
        const request = operation(store);
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error ?? new Error('IndexedDB equalizer read failed'));
        };
    }));
}
function runEqualizerWrite(operation) {
    return openRadioPlayerIndexedDb().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(RADIO_EQUALIZER_SETTINGS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(RADIO_EQUALIZER_SETTINGS_STORE_NAME);
        const request = operation(store);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error ?? new Error('IndexedDB equalizer write failed'));
        };
    }));
}
export function normalizeRadioEqualizerSettingsRecord(value) {
    if (!value || typeof value !== 'object') {
        return createDefaultRadioEqualizerSettings();
    }
    const record = value;
    const presetId = isRadioEqualizerPresetId(record.presetId) ? record.presetId : null;
    const customPresetSlot = isRadioEqualizerCustomSlot(record.customPresetSlot)
        ? record.customPresetSlot
        : null;
    const bandGains = normalizeRadioEqualizerBandGains(Array.isArray(record.bandGains) ? record.bandGains : []);
    return {
        presetId,
        customPresetSlot,
        bandGains: [...bandGains],
        customPresets: normalizeRadioEqualizerCustomPresets(record.customPresets),
        lastSelection: normalizeRadioEqualizerLastSelection({
            lastSelection: record.lastSelection,
            presetId,
            customPresetSlot,
        }),
    };
}
export async function loadRadioEqualizerSettings() {
    if (typeof indexedDB === 'undefined') {
        return createDefaultRadioEqualizerSettings();
    }
    try {
        const record = await runEqualizerRead((store) => store.get(RADIO_EQUALIZER_SETTINGS_RECORD_ID));
        return normalizeRadioEqualizerSettingsRecord(record);
    }
    catch {
        return createDefaultRadioEqualizerSettings();
    }
}
export async function saveRadioEqualizerSettings(settings) {
    if (typeof indexedDB === 'undefined') {
        return;
    }
    const record = {
        id: RADIO_EQUALIZER_SETTINGS_RECORD_ID,
        presetId: settings.presetId,
        customPresetSlot: settings.customPresetSlot,
        bandGains: [...normalizeRadioEqualizerBandGains(settings.bandGains)],
        customPresets: settings.customPresets.map((preset) => ({
            slot: preset.slot,
            label: preset.label,
            bandGains: [...normalizeRadioEqualizerBandGains(preset.bandGains)],
            savedAt: preset.savedAt,
        })),
        lastSelection: settings.lastSelection,
        updatedAt: Date.now(),
    };
    try {
        await runEqualizerWrite((store) => store.put(record));
    }
    catch {
        // Ignore write failures — playback EQ still applies for this session.
    }
}
