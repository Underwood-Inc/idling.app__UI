'use client';

import { useEffect, useRef } from 'react';
import { clearRadioAccountFavoritesOnLogout } from '@widgets/radio-player/radioFavoritesLogoutCleanup';

/**
 * When the listener was signed in and becomes anonymous, purge radio favorites
 * from IndexedDB and optionally reset UI (saved-songs panel).
 */
export function useRadioFavoritesAuthLifecycle(
  userId: string | null,
  onSignedOut?: () => void
): void {
  const hadAuthenticatedUserRef = useRef(false);

  useEffect(() => {
    if (userId) {
      hadAuthenticatedUserRef.current = true;
      return;
    }

    if (!hadAuthenticatedUserRef.current) {
      return;
    }

    hadAuthenticatedUserRef.current = false;
    onSignedOut?.();

    void clearRadioAccountFavoritesOnLogout();
  }, [onSignedOut, userId]);
}