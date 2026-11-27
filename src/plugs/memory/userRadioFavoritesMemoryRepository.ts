import {
  buildRadioSongFavorite,
  createRadioSongFavoriteKey,
} from '@widgets/radio-player/radioSongFavorites';
import type {
  RadioStationFavoriteCloud,
  UserRadioSongFavoritesRepository,
  UserRadioStationFavoritesRepository,
} from '@widgets/radio-player/radioFavoritesRepository';
import type { RadioSongFavorite, RadioSongFavoriteDraft } from '@widgets/radio-player/radioSongFavorites';

type StationStore = Map<number, Map<string, RadioStationFavoriteCloud>>;
type SongStore = Map<number, Map<string, RadioSongFavorite>>;

function stationStoreKey(userId: number, stationName: string): string {
  return `${userId}\u001f${stationName}`;
}

export function createUserRadioFavoritesMemoryRepositories(): {
  stations: UserRadioStationFavoritesRepository;
  songs: UserRadioSongFavoritesRepository;
  reset(): void;
} {
  const stationRows: StationStore = new Map();
  const songRows: SongStore = new Map();

  const stations: UserRadioStationFavoritesRepository = {
    async list(userId) {
      const bucket = stationRows.get(userId);
      if (!bucket) {
        return [];
      }
      return [...bucket.values()].sort((left, right) => right.favoritedAt - left.favoritedAt);
    },

    async setFavorite(userId, stationName, streamUrl, isFavorite) {
      let bucket = stationRows.get(userId);
      if (!bucket) {
        bucket = new Map();
        stationRows.set(userId, bucket);
      }

      if (isFavorite) {
        bucket.set(stationName, {
          stationName,
          streamUrl,
          favoritedAt: Date.now(),
        });
      } else {
        bucket.delete(stationName);
      }

      return stations.list(userId);
    },
  };

  const songs: UserRadioSongFavoritesRepository = {
    async list(userId) {
      const bucket = songRows.get(userId);
      if (!bucket) {
        return [];
      }
      return [...bucket.values()].sort((left, right) => right.savedAt - left.savedAt);
    },

    async setFavorite(userId, draft, saved) {
      const song = buildRadioSongFavorite(draft, Date.now());
      if (!song) {
        return songs.list(userId);
      }

      let bucket = songRows.get(userId);
      if (!bucket) {
        bucket = new Map();
        songRows.set(userId, bucket);
      }

      if (saved) {
        bucket.set(song.songKey, song);
      } else {
        bucket.delete(song.songKey);
      }

      return songs.list(userId);
    },
  };

  return {
    stations,
    songs,
    reset() {
      stationRows.clear();
      songRows.clear();
    },
  };
}

/** Exported for tests that assert stable keys without full repository setup. */
export function memoryStationStoreKey(userId: number, stationName: string): string {
  return stationStoreKey(userId, stationName);
}

export function memorySongStoreKey(userId: number, display: string): string | null {
  return createRadioSongFavoriteKey(display);
}