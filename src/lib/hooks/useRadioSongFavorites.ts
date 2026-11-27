import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isRadioSongSaved,
  toggleRadioSongFavoriteList,
  type RadioSongFavorite,
  type RadioSongFavoriteDraft,
} from '@widgets/radio-player/radioSongFavorites';
import {
  cacheRadioSongFavoriteToggle,
  replaceRadioSongFavoritesCache,
} from '@widgets/radio-player/radioFavoritesIndexedDbCache';
import {
  fetchRadioSongFavoritesCloud,
  putRadioSongFavoriteCloud,
} from '@widgets/radio-player/radioFavoritesHttpClient';
import { listRadioSongFavorites } from '@widgets/radio-player/radioSongFavoritesIndexedDb';

export interface UseRadioSongFavoritesResult {
  savedSongs: RadioSongFavorite[];
  savedSongsLoaded: boolean;
  isSongSaved: (display: string) => boolean;
  toggleSavedSong: (draft: RadioSongFavoriteDraft) => Promise<void>;
}

export function useRadioSongFavorites(userId: string | null): UseRadioSongFavoritesResult {
  const [savedSongs, setSavedSongs] = useState<RadioSongFavorite[]>([]);
  const [savedSongsLoaded, setSavedSongsLoaded] = useState(false);
  const savedSongsRef = useRef<RadioSongFavorite[]>([]);
  const epochRef = useRef(0);

  const commitSongs = useCallback((epoch: number, songs: RadioSongFavorite[]) => {
    if (epoch !== epochRef.current) {
      return;
    }
    savedSongsRef.current = songs;
    setSavedSongs(songs);
  }, []);

  useEffect(() => {
    const epoch = ++epochRef.current;

    if (!userId) {
      savedSongsRef.current = [];
      setSavedSongs([]);
      setSavedSongsLoaded(true);
      return undefined;
    }

    let cancelled = false;
    setSavedSongsLoaded(false);

    void (async () => {
      try {
        const songs = await fetchRadioSongFavoritesCloud();
        if (cancelled || epoch !== epochRef.current) {
          return;
        }
        commitSongs(epoch, songs);
        setSavedSongsLoaded(true);
        void replaceRadioSongFavoritesCache(userId, songs);
      } catch {
        try {
          const songs = await listRadioSongFavorites(userId);
          if (cancelled || epoch !== epochRef.current) {
            return;
          }
          commitSongs(epoch, songs);
          setSavedSongsLoaded(true);
        } catch {
          if (!cancelled && epoch === epochRef.current) {
            setSavedSongsLoaded(true);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [commitSongs, userId]);

  const toggleSavedSong = useCallback(
    async (draft: RadioSongFavoriteDraft) => {
      if (!userId) {
        return;
      }

      // Read the latest list here. A setState updater can be deferred while the
      // player is rendering, and the persist call would then delete instead of save.
      // Bumping the epoch also drops an in-flight favorites load that would wipe the row.
      const epoch = ++epochRef.current;
      const savedAt = Date.now();
      const shouldSave = !isRadioSongSaved(savedSongsRef.current, draft.display);
      const next = toggleRadioSongFavoriteList(savedSongsRef.current, draft, savedAt);
      savedSongsRef.current = next;
      setSavedSongs(next);

      try {
        const songs = await putRadioSongFavoriteCloud(draft, shouldSave);
        if (epoch !== epochRef.current) {
          return;
        }
        savedSongsRef.current = songs;
        setSavedSongs(songs);
        void cacheRadioSongFavoriteToggle(userId, draft, shouldSave, savedAt);
      } catch {
        try {
          const songs = await listRadioSongFavorites(userId);
          commitSongs(epoch, songs);
        } catch {
          /* keep the optimistic list */
        }
      }
    },
    [commitSongs, userId]
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
