import { idlingFetch } from '@lib/oce/idlingFetch';
import type { RadioSongFavorite, RadioSongFavoriteDraft } from './radioSongFavorites';
import type { RadioStationFavoriteCloud } from './radioFavoritesRepository';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Radio favorites request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchRadioStationFavoritesCloud(): Promise<RadioStationFavoriteCloud[]> {
  const response = await idlingFetch('/api/radio/favorites/stations', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const body = await parseJson<{ stations: RadioStationFavoriteCloud[] }>(response);
  return body.stations;
}

export async function putRadioStationFavoriteCloud(
  stationName: string,
  saved: boolean
): Promise<RadioStationFavoriteCloud[]> {
  const response = await idlingFetch('/api/radio/favorites/stations', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stationName, saved }),
  });
  const body = await parseJson<{ stations: RadioStationFavoriteCloud[] }>(response);
  return body.stations;
}

export async function fetchRadioSongFavoritesCloud(): Promise<RadioSongFavorite[]> {
  const response = await idlingFetch('/api/radio/favorites/songs', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const body = await parseJson<{ songs: RadioSongFavorite[] }>(response);
  return body.songs;
}

export async function putRadioSongFavoriteCloud(
  draft: RadioSongFavoriteDraft,
  saved: boolean
): Promise<RadioSongFavorite[]> {
  const response = await idlingFetch('/api/radio/favorites/songs', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ draft, saved }),
  });
  const body = await parseJson<{ songs: RadioSongFavorite[] }>(response);
  return body.songs;
}