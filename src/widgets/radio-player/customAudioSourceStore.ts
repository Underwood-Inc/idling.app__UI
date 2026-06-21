import type { CustomAudioSourceRecord } from './radioPlayer.types';

export const CUSTOM_AUDIO_SOURCE_DB_NAME = 'idling-radio-player';
export const CUSTOM_AUDIO_SOURCE_DB_VERSION = 1;
export const CUSTOM_AUDIO_SOURCE_STORE_NAME = 'custom-audio-sources';

function openCustomAudioSourceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(CUSTOM_AUDIO_SOURCE_DB_NAME, CUSTOM_AUDIO_SOURCE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CUSTOM_AUDIO_SOURCE_STORE_NAME)) {
        db.createObjectStore(CUSTOM_AUDIO_SOURCE_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open custom audio source database.'));
    };
  });
}

function runStoreTransaction<T>(
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openCustomAudioSourceDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(CUSTOM_AUDIO_SOURCE_STORE_NAME, mode);
        const store = transaction.objectStore(CUSTOM_AUDIO_SOURCE_STORE_NAME);
        const request = runner(store);

        request.onsuccess = () => {
          resolve(request.result as T);
        };

        request.onerror = () => {
          reject(request.error ?? new Error('Custom audio source store request failed.'));
        };

        transaction.oncomplete = () => {
          db.close();
        };

        transaction.onerror = () => {
          reject(transaction.error ?? new Error('Custom audio source transaction failed.'));
        };
      })
  );
}

export async function listCustomAudioSources(): Promise<CustomAudioSourceRecord[]> {
  const records = await runStoreTransaction('readonly', (store) => store.getAll());
  return records.sort((left, right) => left.name.localeCompare(right.name));
}

export async function putCustomAudioSource(
  record: CustomAudioSourceRecord
): Promise<CustomAudioSourceRecord> {
  await runStoreTransaction('readwrite', (store) => store.put(record));
  return record;
}

export async function deleteCustomAudioSource(id: string): Promise<void> {
  await runStoreTransaction('readwrite', (store) => store.delete(id));
}

export async function getCustomAudioSource(
  id: string
): Promise<CustomAudioSourceRecord | undefined> {
  return runStoreTransaction('readonly', (store) => store.get(id));
}
