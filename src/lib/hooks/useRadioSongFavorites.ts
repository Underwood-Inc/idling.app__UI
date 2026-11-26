import { useCallback, useEffect, useState } from 'react';
import {
  isRadioSongSaved,
  toggleRadioSongFavoriteList,
  type RadioSongFavorite,
  type RadioSongFavoriteDraft,
} from '@widgets/radio-player/radioSongFavorites';
import {
  listRadioSongFavorites,
  setRadioSongFavorite,
} from '@widgets/radio-player/radioSongFavoritesIndexedDb';

export interface UseRadioSongFavoritesResult {
  savedSongs: RadioSongFavorite[];
  savedSongsLoaded: boolean;
  isSongSaved: (display: string) => boolean;
  toggleSavedSong: (draft: RadioSongFavoriteDraft) => Promise<void>;
}

export function useRadioSongFavorites(userId: string | null): UseRadioSongFavoritesResult {
  const [savedSongs, setSavedSongs] = useState<RadioSongFavorite[]>([]);
  const [savedSongsLoaded, setSavedSongsLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSavedSongs([]);
      setSavedSongsLoaded(true);
      return undefined;
    }

    let cancelled = false;
    setSavedSongsLoaded(false);

    void (async () => {
      const songs = await listRadioSongFavorites(userId);
      if (!cancelled) {
        setSavedSongs(songs);
        setSavedSongsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleSavedSong = useCallback(
    async (draft: RadioSongFavoriteDraft) => {
      if (!userId) {
        return;
      }

      let shouldSave = false;
      setSavedSongs((current) => {
        shouldSave = !isRadioSongSaved(current, draft.display);
        return toggleRadioSongFavoriteList(current, draft, Date.now());
      });

      try {
        const songs = await setRadioSongFavorite(userId, draft, shouldSave);
        setSavedSongs(songs);
      } catch {
        const songs = await listRadioSongFavorites(userId);
        setSavedSongs(songs);
      }
    },
    [userId]
  );

  const isSongSaved = useCallback(
    (display: string) => isRadioSongSaved(savedSongs, display),
    [savedSongs]
  );

  return {
    savedSongs,
    savedSongsLoaded,
    isSongSaved,
    toggleSavedSong,
  };
}
