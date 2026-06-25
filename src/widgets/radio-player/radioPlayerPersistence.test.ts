import {
  deleteNonPreservedIndexedDatabases,
  isPreservedRadioIndexedDb,
  PRESERVED_RADIO_LOCAL_STORAGE_KEYS,
  restorePreservedRadioLocalStorage,
  snapshotPreservedRadioLocalStorage,
} from './radioPlayerPersistence';
import { RADIO_PLAYER_STORAGE_KEY } from './radio-player';

describe('radioPlayerPersistence', () => {
  test('preserves the radio player IndexedDB database during cache clears', () => {
    expect(isPreservedRadioIndexedDb('idling-radio-player')).toBe(true);
    expect(isPreservedRadioIndexedDb('some-other-db')).toBe(false);
  });

  test('snapshots and restores radio localStorage keys', () => {
    localStorage.setItem(RADIO_PLAYER_STORAGE_KEY, 'Jazz24');

    const snapshot = snapshotPreservedRadioLocalStorage();
    localStorage.clear();

    expect(localStorage.getItem(RADIO_PLAYER_STORAGE_KEY)).toBeNull();

    restorePreservedRadioLocalStorage(snapshot);

    expect(localStorage.getItem(RADIO_PLAYER_STORAGE_KEY)).toBe('Jazz24');
  });

  test('lists every radio preference storage key', () => {
    expect(PRESERVED_RADIO_LOCAL_STORAGE_KEYS).toContain(RADIO_PLAYER_STORAGE_KEY);
  });

  test('deleteNonPreservedIndexedDatabases deletes every listed database', async () => {
    const deleted: string[] = [];

    const mockIndexedDB = {
      databases: async () => [
        { name: 'idling-radio-player' },
        { name: 'app-cache-db' },
      ],
      deleteDatabase: (name: string) => {
        deleted.push(name);
        const request = {
          onsuccess: null as null | (() => void),
          onerror: null as null | (() => void),
          onblocked: null as null | (() => void),
        };
        queueMicrotask(() => {
          request.onsuccess?.();
        });
        return request;
      },
    };

    Object.defineProperty(globalThis, 'indexedDB', {
      value: mockIndexedDB,
      configurable: true,
    });

    await deleteNonPreservedIndexedDatabases();

    expect(deleted).toEqual(['app-cache-db']);
  });
});
