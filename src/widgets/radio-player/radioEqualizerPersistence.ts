import {
  createDefaultRadioEqualizerSettings,
  isRadioEqualizerPresetId,
  normalizeRadioEqualizerBandGains,
} from './radioEqualizerPresets';
import {
  isRadioEqualizerCustomSlot,
  normalizeRadioEqualizerCustomPresets,
} from './radioEqualizerCustomPresets';
import { normalizeRadioEqualizerLastSelection } from './radioEqualizerLastSelection';
import { openRadioPlayerIndexedDb } from './radioStationFavoritesIndexedDb';
import type { RadioEqualizerSettings, RadioEqualizerSettingsRecord } from './radioEqualizer.types';

export const RADIO_EQUALIZER_SETTINGS_STORE_NAME = 'equalizerSettings';
export const RADIO_EQUALIZER_SETTINGS_RECORD_ID = 'active';

function runEqualizerRead<T>(operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openRadioPlayerIndexedDb().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(RADIO_EQUALIZER_SETTINGS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(RADIO_EQUALIZER_SETTINGS_STORE_NAME);
        const request = operation(store);

        request.onsuccess = () => {
          resolve(request.result as T);
        };

        request.onerror = () => {
          reject(request.error ?? new Error('IndexedDB equalizer read failed'));
        };
      })
  );
}

function runEqualizerWrite(
  operation: (store: IDBObjectStore) => IDBRequest
): Promise<void> {
  return openRadioPlayerIndexedDb().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(RADIO_EQUALIZER_SETTINGS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(RADIO_EQUALIZER_SETTINGS_STORE_NAME);
        const request = operation(store);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error ?? new Error('IndexedDB equalizer write failed'));
        };
      })
  );
}

export function normalizeRadioEqualizerSettingsRecord(
  value: unknown
): RadioEqualizerSettings {
  if (!value || typeof value !== 'object') {
    return createDefaultRadioEqualizerSettings();
  }

  const record = value as Partial<RadioEqualizerSettingsRecord>;
  const presetId = isRadioEqualizerPresetId(record.presetId) ? record.presetId : null;
  const customPresetSlot = isRadioEqualizerCustomSlot(record.customPresetSlot)
    ? record.customPresetSlot
    : null;
  const bandGains = normalizeRadioEqualizerBandGains(
    Array.isArray(record.bandGains) ? record.bandGains : []
  );

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

export async function loadRadioEqualizerSettings(): Promise<RadioEqualizerSettings> {
  if (typeof indexedDB === 'undefined') {
    return createDefaultRadioEqualizerSettings();
  }

  try {
    const record = await runEqualizerRead<RadioEqualizerSettingsRecord | undefined>((store) =>
      store.get(RADIO_EQUALIZER_SETTINGS_RECORD_ID)
    );

    return normalizeRadioEqualizerSettingsRecord(record);
  } catch {
    return createDefaultRadioEqualizerSettings();
  }
}

export async function saveRadioEqualizerSettings(settings: RadioEqualizerSettings): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return;
  }

  const record: RadioEqualizerSettingsRecord = {
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
  } catch {
    // Ignore write failures — playback EQ still applies for this session.
  }
}
