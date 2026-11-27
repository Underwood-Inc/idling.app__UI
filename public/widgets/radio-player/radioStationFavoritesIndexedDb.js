import { RADIO_EQUALIZER_SETTINGS_STORE_NAME } from './radioEqualizerPersistence';
export const RADIO_PLAYER_INDEXED_DB_NAME = 'idling-radio-player';
export const RADIO_STATION_FAVORITES_STORE_NAME = 'stationFavorites';
export const RADIO_SONG_FAVORITES_STORE_NAME = 'songFavorites';
export const RADIO_PLAYER_INDEXED_DB_VERSION = 3;
let openDatabasePromise = null;
function isIndexedDbAvailable() {
    return typeof indexedDB !== 'undefined';
}
export function openRadioPlayerIndexedDb() {
    if (!isIndexedDbAvailable()) {
        return Promise.reject(new Error('IndexedDB is not available'));
    }
    if (!openDatabasePromise) {
        openDatabasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(RADIO_PLAYER_INDEXED_DB_NAME, RADIO_PLAYER_INDEXED_DB_VERSION);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(RADIO_STATION_FAVORITES_STORE_NAME)) {
                    database.createObjectStore(RADIO_STATION_FAVORITES_STORE_NAME, {
                        keyPath: 'stationName',
                    });
                }
                if (!database.objectStoreNames.contains(RADIO_EQUALIZER_SETTINGS_STORE_NAME)) {
                    database.createObjectStore(RADIO_EQUALIZER_SETTINGS_STORE_NAME, {
                        keyPath: 'id',
                    });
                }
                if (!database.objectStoreNames.contains(RADIO_SONG_FAVORITES_STORE_NAME)) {
                    const songStore = database.createObjectStore(RADIO_SONG_FAVORITES_STORE_NAME, {
                        keyPath: 'id',
                    });
                    songStore.createIndex('byUser', 'userId', { unique: false });
                }
            };
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                openDatabasePromise = null;
                reject(request.error ?? new Error('Failed to open radio player IndexedDB'));
            };
            request.onblocked = () => {
                openDatabasePromise = null;
                reject(new Error('Radio player IndexedDB open was blocked'));
            };
        });
    }
    return openDatabasePromise;
}
export function resetRadioPlayerIndexedDbForTests() {
    openDatabasePromise = null;
}
function runReadonlyTransaction(operation) {
    return openRadioPlayerIndexedDb().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(RADIO_STATION_FAVORITES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(RADIO_STATION_FAVORITES_STORE_NAME);
        const request = operation(store);
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error ?? new Error('IndexedDB read failed'));
        };
    }));
}
function runReadWriteTransaction(operation) {
    return openRadioPlayerIndexedDb().then((database) => new Promise((resolve, reject) => {
        const transaction = database.transaction(RADIO_STATION_FAVORITES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(RADIO_STATION_FAVORITES_STORE_NAME);
        const request = operation(store);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error ?? new Error('IndexedDB write failed'));
        };
    }));
}
export async function listRadioStationFavoriteRecords() {
    if (!isIndexedDbAvailable()) {
        return [];
    }
    try {
        const records = await runReadonlyTransaction((store) => store.getAll());
        return records.sort((left, right) => right.favoritedAt - left.favoritedAt);
    }
    catch {
        return [];
    }
}
export async function listRadioStationFavoriteNames() {
    const records = await listRadioStationFavoriteRecords();
    return records.map((record) => record.stationName);
}
export async function setRadioStationFavorite(stationName, isFavorite) {
    if (!stationName.trim()) {
        return listRadioStationFavoriteNames();
    }
    if (!isIndexedDbAvailable()) {
        return [];
    }
    if (isFavorite) {
        const record = {
            stationName,
            favoritedAt: Date.now(),
        };
        await runReadWriteTransaction((store) => store.put(record));
    }
    else {
        await runReadWriteTransaction((store) => store.delete(stationName));
    }
    return listRadioStationFavoriteNames();
}
