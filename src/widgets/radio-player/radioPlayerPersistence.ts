import { RADIO_PLAYER_STORAGE_KEY } from './radio-player';
import { RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY } from './radioFullscreenVisualizerDisplay';
import { BAR_VISUALIZER_PREFS_STORAGE_KEY } from './barVisualizerPreferences';
import { RADIO_NO_TRACK_METADATA_STORAGE_KEY } from './radioStationMetadata';
import { RADIO_STATION_GENRE_FILTER_STORAGE_KEY } from './radioStationGenreFilterPersistence';
import { RADIO_PLAYER_INDEXED_DB_NAME } from './radioStationFavoritesIndexedDb';

export interface RadioPlayerPersistenceSnapshot {
  localStorage: Record<string, string>;
}

/** localStorage keys for radio player preferences and station selection. */
export const PRESERVED_RADIO_LOCAL_STORAGE_KEYS: readonly string[] = [
  RADIO_PLAYER_STORAGE_KEY,
  RADIO_STATION_GENRE_FILTER_STORAGE_KEY,
  BAR_VISUALIZER_PREFS_STORAGE_KEY,
  RADIO_FULLSCREEN_VISUALIZER_DISPLAY_STORAGE_KEY,
  RADIO_NO_TRACK_METADATA_STORAGE_KEY,
];

export function isPreservedRadioIndexedDb(dbName: string): boolean {
  return dbName === RADIO_PLAYER_INDEXED_DB_NAME;
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
