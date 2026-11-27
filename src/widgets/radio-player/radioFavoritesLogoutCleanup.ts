import {
  openRadioPlayerIndexedDb,
  RADIO_SONG_FAVORITES_STORE_NAME,
  RADIO_STATION_FAVORITES_STORE_NAME,
} from './radioStationFavoritesIndexedDb';

function clearObjectStore(storeName: string): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve();
  }

  return openRadioPlayerIndexedDb().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(request.error ?? new Error(`Failed to clear ${storeName}`));

        transaction.onerror = () =>
          reject(transaction.error ?? new Error(`Transaction failed for ${storeName}`));
      })
  );
}

/**
 * Remove account-scoped radio favorites from IndexedDB on sign-out.
 * Preserves the radio DB (equalizer / prefs stores); only clears favorites.
 */
export async function clearRadioAccountFavoritesOnLogout(): Promise<void> {
  try {
    await clearObjectStore(RADIO_SONG_FAVORITES_STORE_NAME);
    await clearObjectStore(RADIO_STATION_FAVORITES_STORE_NAME);
  } catch {
    // Logout must continue even if IDB is blocked or unavailable.
  }
}