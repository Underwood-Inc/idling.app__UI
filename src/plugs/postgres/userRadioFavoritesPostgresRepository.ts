import sql from '@lib/db';
import {
  buildRadioSongFavorite,
  type RadioSongFavorite,
  type RadioSongFavoriteDraft,
} from '@widgets/radio-player/radioSongFavorites';
import type {
  RadioStationFavoriteCloud,
  UserRadioSongFavoritesRepository,
  UserRadioStationFavoritesRepository,
} from '@widgets/radio-player/radioFavoritesRepository';

interface StationRow {
  station_name: string;
  stream_url: string;
  favorited_at: Date;
}

interface SongRow {
  song_key: string;
  display: string;
  artist: string | null;
  title: string | null;
  station_name: string;
  station_genre: string | null;
  saved_at: Date;
}

function mapStationRow(row: StationRow): RadioStationFavoriteCloud {
  return {
    stationName: row.station_name,
    streamUrl: row.stream_url,
    favoritedAt: row.favorited_at.getTime(),
  };
}

function mapSongRow(row: SongRow): RadioSongFavorite {
  const savedAt =
    row.saved_at instanceof Date && !Number.isNaN(row.saved_at.getTime())
      ? row.saved_at.getTime()
      : 0;
  return {
    songKey: row.song_key,
    display: row.display,
    artist: row.artist,
    title: row.title,
    stationName: row.station_name ?? '',
    stationGenre: (row.station_genre as RadioSongFavorite['stationGenre']) ?? null,
    savedAt,
    favoritedAt: savedAt > 0 ? new Date(savedAt).toISOString() : null,
  };
}

export const userRadioStationFavoritesPostgresRepository: UserRadioStationFavoritesRepository = {
  async list(userId) {
    const rows = await sql<StationRow[]>`
      SELECT station_name, stream_url, favorited_at
      FROM user_radio_station_favorites
      WHERE user_id = ${userId}
      ORDER BY favorited_at DESC
    `;
    return rows.map(mapStationRow);
  },

  async setFavorite(userId, stationName, streamUrl, isFavorite) {
    if (isFavorite) {
      await sql`
        INSERT INTO user_radio_station_favorites (user_id, station_name, stream_url, favorited_at)
        VALUES (${userId}, ${stationName}, ${streamUrl}, NOW())
        ON CONFLICT (user_id, station_name) DO UPDATE SET
          stream_url = EXCLUDED.stream_url,
          favorited_at = NOW()
      `;
    } else {
      await sql`
        DELETE FROM user_radio_station_favorites
        WHERE user_id = ${userId} AND station_name = ${stationName}
      `;
    }

    return userRadioStationFavoritesPostgresRepository.list(userId);
  },
};

export const userRadioSongFavoritesPostgresRepository: UserRadioSongFavoritesRepository = {
  async list(userId) {
    const rows = await sql<SongRow[]>`
      SELECT song_key, display, artist, title, station_name, station_genre, saved_at
      FROM user_radio_song_favorites
      WHERE user_id = ${userId}
      ORDER BY saved_at DESC
    `;
    return rows.map(mapSongRow);
  },

  async setFavorite(userId, draft, saved) {
    const song = buildRadioSongFavorite(draft, Date.now());
    if (!song) {
      return userRadioSongFavoritesPostgresRepository.list(userId);
    }

    if (saved) {
      await sql`
        INSERT INTO user_radio_song_favorites (
          user_id, song_key, display, artist, title, station_name, station_genre, saved_at
        ) VALUES (
          ${userId},
          ${song.songKey},
          ${song.display},
          ${song.artist},
          ${song.title},
          ${song.stationName},
          ${song.stationGenre ?? null},
          ${new Date(song.savedAt)}
        )
        ON CONFLICT (user_id, song_key) DO UPDATE SET
          display = EXCLUDED.display,
          artist = EXCLUDED.artist,
          title = EXCLUDED.title,
          station_name = EXCLUDED.station_name,
          station_genre = EXCLUDED.station_genre,
          saved_at = EXCLUDED.saved_at
      `;
    } else {
      await sql`
        DELETE FROM user_radio_song_favorites
        WHERE user_id = ${userId} AND song_key = ${song.songKey}
      `;
    }

    return userRadioSongFavoritesPostgresRepository.list(userId);
  },
};