import {
  openRadioPlayerIndexedDb,
  RADIO_SONG_FAVORITES_STORE_NAME,
} from './radioStationFavoritesIndexedDb';
import {
  buildRadioSongFavorite,
  trimUnknownText,
  type RadioSongFavorite,
  type RadioSongFavoriteDraft,
} from './radioSongFavorites';

export interface RadioSongFavoriteRecord extends RadioSongFavorite {
  id: string;
  userId: string;
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function radioSongFavoriteRecordId(userId: string, songKey: string): string {
  return `${userId}\u001f${songKey}`;
}

function runSongStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openRadioPlayerIndexedDb().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(RADIO_SONG_FAVORITES_STORE_NAME, mode);
        const store = transaction.objectStore(RADIO_SONG_FAVORITES_STORE_NAME);
        const request = operation(store);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error ?? new Error('IndexedDB song favorite request failed'));
        };
      })
  );
}

function readSavedAt(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sortSavedSongs(records: RadioSongFavoriteRecord[]): RadioSongFavorite[] {
  return records
    .slice()
    .sort((left, right) => readSavedAt(right.savedAt) - readSavedAt(left.savedAt))
    .map((record) => {
      const savedAt = readSavedAt(record.savedAt);
      const favoritedAt =
        typeof record.favoritedAt === 'string' && record.favoritedAt.trim().length > 0
          ? record.favoritedAt
          : null;
      return {
        songKey: record.songKey,
        display: record.display,
        artist: record.artist ?? null,
        title: record.title ?? null,
        stationName: typeof record.stationName === 'string' ? record.stationName : '',
        stationGenre: record.stationGenre ?? null,
        savedAt,
        favoritedAt,
      };
    });
}

export async function listRadioSongFavorites(userId: string): Promise<RadioSongFavorite[]> {
  if (!trimUnknownText(userId) || !isIndexedDbAvailable()) {
    return [];
  }

  try {
    const records = await runSongStore<RadioSongFavoriteRecord[]>('readonly', (store) =>
      store.getAll()
    );
    return sortSavedSongs(records.filter((record) => record.userId === userId));
  } catch {
    return [];
  }
}

export async function setRadioSongFavorite(
  userId: string,
  draft: RadioSongFavoriteDraft,
  saved: boolean,
  savedAt: number = Date.now()
): Promise<RadioSongFavorite[]> {
  const song = buildRadioSongFavorite(draft, savedAt);
  if (!trimUnknownText(userId) || !song || !isIndexedDbAvailable()) {
    return listRadioSongFavorites(userId);
  }

  try {
    const id = radioSongFavoriteRecordId(userId, song.songKey);
    if (saved) {
      const record: RadioSongFavoriteRecord = { ...song, id, userId };
      await runSongStore('readwrite', (store) => store.put(record));
    } else {
      await runSongStore('readwrite', (store) => store.delete(id));
    }
  } catch {
    return listRadioSongFavorites(userId);
  }

  return listRadioSongFavorites(userId);
}
