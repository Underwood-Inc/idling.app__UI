import { describe, expect, test } from 'vitest';
import { clearRadioAccountFavoritesOnLogout } from './radioFavoritesLogoutCleanup';

describe('clearRadioAccountFavoritesOnLogout', () => {
  test('when IndexedDB is unavailable, clearRadioAccountFavoritesOnLogout does not throw', async () => {
    await expect(clearRadioAccountFavoritesOnLogout()).resolves.toBeUndefined();
  });
});