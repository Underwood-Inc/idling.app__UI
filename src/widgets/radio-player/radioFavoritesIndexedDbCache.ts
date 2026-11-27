import { listRadioSongFavorites, setRadioSongFavorite } from './radioSongFavoritesIndexedDb';
import {
  listRadioStationFavoriteRecords,
  setRadioStationFavorite,
} from './radioStationFavoritesIndexedDb';
import type { RadioSongFavorite, RadioSongFavoriteDraft } from './radioSongFavorites';
import type { RadioStationFavoriteCloud } from './radioFavoritesRepository';

export async function replaceRadioStationFavoritesCache(
  stations: readonly RadioStationFavoriteCloud[]
): Promise<void> {
  const existing = await listRadioStationFavoriteRecords();
  const keep = new Set(stations.map((station) => station.stationName));

  for (const record of existing) {
    if (!keep.has(record.stationName)) {
      await setRadioStationFavorite(record.stationName, false);
    }
  }

  for (const station of stations) {
    await setRadioStationFavorite(station.stationName, true);
  }
}

export async function replaceRadioSongFavoritesCache(
  userId: string,
  songs: readonly RadioSongFavorite[]
): Promise<void> {
  const existing = await listRadioSongFavorites(userId);
  const keep = new Set(songs.map((song) => song.songKey));

  for (const song of existing) {
    if (!keep.has(song.songKey)) {
      await setRadioSongFavorite(
        userId,
        {
          display: song.display,
          artist: song.artist,
          title: song.title,
          stationName: song.stationName,
          stationGenre: song.stationGenre ?? null,
        },
        false
      );
    }
  }

  for (const song of songs) {
    await setRadioSongFavorite(
      userId,
      {
        display: song.display,
        artist: song.artist,
        title: song.title,
        stationName: song.stationName,
        stationGenre: song.stationGenre ?? null,
      },
      true,
      song.savedAt > 0 ? song.savedAt : Date.now()
    );
  }
}

export async function cacheRadioSongFavoriteToggle(
  userId: string,
  draft: RadioSongFavoriteDraft,
  saved: boolean,
  savedAt: number = Date.now()
): Promise<void> {
  await setRadioSongFavorite(userId, draft, saved, savedAt);
}