-- Cloud-backed radio station and song favorites (per authenticated user)

CREATE TABLE IF NOT EXISTS user_radio_station_favorites (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  station_name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  favorited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, station_name)
);

CREATE INDEX IF NOT EXISTS user_radio_station_favorites_user_favorited_idx
  ON user_radio_station_favorites (user_id, favorited_at DESC);

CREATE TABLE IF NOT EXISTS user_radio_song_favorites (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  song_key TEXT NOT NULL,
  display TEXT NOT NULL,
  artist TEXT,
  title TEXT,
  station_name TEXT NOT NULL,
  station_genre TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, song_key)
);

CREATE INDEX IF NOT EXISTS user_radio_song_favorites_user_saved_idx
  ON user_radio_song_favorites (user_id, saved_at DESC);

COMMENT ON TABLE user_radio_station_favorites IS 'Favorite radio stations synced per user account';
COMMENT ON TABLE user_radio_song_favorites IS 'Saved now-playing tracks synced per user account';