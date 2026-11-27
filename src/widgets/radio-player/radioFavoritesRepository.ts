import type { RadioStationGenreId } from './radioPlayer.types';
import type { RadioSongFavorite, RadioSongFavoriteDraft } from './radioSongFavorites';

export interface RadioStationFavoriteCloud {
  stationName: string;
  streamUrl: string;
  favoritedAt: number;
}

export interface UserRadioStationFavoritesRepository {
  list(userId: number): Promise<RadioStationFavoriteCloud[]>;
  setFavorite(
    userId: number,
    stationName: string,
    streamUrl: string,
    isFavorite: boolean
  ): Promise<RadioStationFavoriteCloud[]>;
}

export interface UserRadioSongFavoritesRepository {
  list(userId: number): Promise<RadioSongFavorite[]>;
  setFavorite(
    userId: number,
    draft: RadioSongFavoriteDraft,
    saved: boolean
  ): Promise<RadioSongFavorite[]>;
}

export type { RadioStationGenreId };