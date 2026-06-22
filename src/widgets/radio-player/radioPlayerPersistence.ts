import {
  CUSTOM_AUDIO_SOURCE_DB_NAME,
  CUSTOM_AUDIO_SOURCE_STORE_NAME,
} from './customAudioSourceStore';
import { RADIO_PLAYER_STORAGE_KEY } from './radio-player';
import { RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY } from './radioFullscreenVisualizerDisplay';
import { BAR_VISUALIZER_PREFS_STORAGE_KEY } from './barVisualizerPreferences';
import { RADIO_NO_TRACK_METADATA_STORAGE_KEY } from './radioStationMetadata';
import { RADIO_STATION_GENRE_FILTER_STORAGE_KEY } from './radioStationGenreFilterPersistence';

export interface RadioPlayerPersistenceSnapshot {
  localStorage: Record<string, string>;
}

/** IndexedDB databases that must survive deploy cache resets and hard resets. */
export const PRESERVED_RADIO_INDEXED_DB_NAMES: ReadonlySet<string> = new Set([
  CUSTOM_AUDIO_SOURCE_DB_NAME,
]);

/** localStorage keys for radio player preferences and custom station selection. */
export const PRESERVED_RADIO_LOCAL_STORAGE_KEYS: readonly string[] = [
  RADIO_PLAYER_STORAGE_KEY,
  RADIO_STATION_GENRE_FILTER_STORAGE_KEY,
  BAR_VISUALIZER_PREFS_STORAGE_KEY,
  RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY,
  RADIO_NO_TRACK_METADATA_STORAGE_KEY,
];

export function isPreservedRadioIndexedDb(dbName: string): boolean {
  return PRESERVED_RADIO_INDEXED_DB_NAMES.has(dbName);
}

export function snapshotPreservedRadioLocalStorage(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const snapshot: Record<string, string> = {};

  PRESERVED_RADIO_LOCAL_STORAGE_KEYS.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        snapshot[key] = value;
      }
    } catch {
      // Ignore read failures during snapshot.
    }
  });

  return snapshot;
}

export function restorePreservedRadioLocalStorage(snapshot: Record<string, string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  Object.entries(snapshot).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore restore failures.
    }
  });
}

export async function deleteNonPreservedIndexedDatabases(): Promise<boolean> {
  if (typeof indexedDB === 'undefined' || !('databases' in indexedDB)) {
    return false;
  }

  try {
    const databases = await indexedDB.databases();

    await Promise.all(
      databases.map((db) => {
        if (!db.name || isPreservedRadioIndexedDb(db.name)) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const deleteReq = indexedDB.deleteDatabase(db.name!);
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => reject(deleteReq.error);
          deleteReq.onblocked = () => resolve();
        });
      })
    );

    return true;
  } catch {
    return false;
  }
}

export { CUSTOM_AUDIO_SOURCE_DB_NAME, CUSTOM_AUDIO_SOURCE_STORE_NAME };
