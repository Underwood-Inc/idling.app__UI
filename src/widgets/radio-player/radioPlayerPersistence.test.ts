import {
  createCustomAudioSourceFromUrl,
  deriveCustomAudioSourceName,
} from './customAudioSourceBrowse';
import {
  CUSTOM_AUDIO_SOURCE_DB_NAME,
  deleteNonPreservedIndexedDatabases,
  isPreservedRadioIndexedDb,
  PRESERVED_RADIO_LOCAL_STORAGE_KEYS,
  restorePreservedRadioLocalStorage,
  snapshotPreservedRadioLocalStorage,
} from './radioPlayerPersistence';
import { RADIO_PLAYER_STORAGE_KEY } from './radio-player';

describe('radioPlayerPersistence', () => {
  test('marks the custom audio source database as preserved', () => {
    expect(isPreservedRadioIndexedDb(CUSTOM_AUDIO_SOURCE_DB_NAME)).toBe(true);
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

  test('deleteNonPreservedIndexedDatabases skips preserved radio database', async () => {
    const deleted: string[] = [];

    const mockIndexedDB = {
      databases: async () => [
        { name: CUSTOM_AUDIO_SOURCE_DB_NAME },
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
    expect(deleted).not.toContain(CUSTOM_AUDIO_SOURCE_DB_NAME);
  });
});

describe('createCustomAudioSourceFromUrl', () => {
  test('derives a hostname-based name and defaults to live-stream custom genre', () => {
    const reserved = ['example.com'];
    const name = deriveCustomAudioSourceName('https://example.com/live.mp3', reserved);

    expect(name).toBe('example.com 2');
  });

  test('creates a record from a URL without manual metadata', () => {
    const reserved: string[] = [];
    const result = createCustomAudioSourceFromUrl('https://radio.example.org/stream.m3u8', reserved);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.name).toBe('radio.example.org');
      expect(result.record.kind).toBe('live-stream');
      expect(result.record.genre).toBe('custom');
      expect(result.record.url).toBe('https://radio.example.org/stream.m3u8');
    }
  });
});
