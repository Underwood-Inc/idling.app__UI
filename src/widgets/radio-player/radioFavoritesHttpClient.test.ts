import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  fetchRadioSongFavoritesCloud,
  fetchRadioStationFavoritesCloud,
  putRadioSongFavoriteCloud,
  putRadioStationFavoriteCloud,
} from './radioFavoritesHttpClient';

const idlingFetchMock = vi.fn();

vi.mock('@lib/oce/idlingFetch', () => ({
  idlingFetch: (...args: unknown[]) => idlingFetchMock(...args),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  idlingFetchMock.mockReset();
});

describe('radioFavoritesHttpClient', () => {
  test('fetchRadioStationFavoritesCloud uses idlingFetch on the stations route', async () => {
    idlingFetchMock.mockResolvedValue(
      jsonResponse({ stations: [{ stationName: 'WEFUNK', savedAt: '2020-01-01T00:00:00.000Z' }] })
    );

    const stations = await fetchRadioStationFavoritesCloud();

    expect(idlingFetchMock).toHaveBeenCalledWith('/api/radio/favorites/stations', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    expect(stations).toHaveLength(1);
  });

  test('putRadioStationFavoriteCloud uses idlingFetch with PUT body', async () => {
    idlingFetchMock.mockResolvedValue(jsonResponse({ stations: [] }));

    await putRadioStationFavoriteCloud('Jazz FM', true);

    expect(idlingFetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/stations',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ stationName: 'Jazz FM', saved: true }),
      })
    );
  });

  test('fetchRadioSongFavoritesCloud uses idlingFetch on the songs route', async () => {
    idlingFetchMock.mockResolvedValue(jsonResponse({ songs: [] }));

    await fetchRadioSongFavoritesCloud();

    expect(idlingFetchMock).toHaveBeenCalledWith('/api/radio/favorites/songs', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  });

  test('putRadioSongFavoriteCloud uses idlingFetch with song draft body', async () => {
    const draft = {
      display: 'Artist — Track',
      stationName: 'WEFUNK',
      title: 'Track',
      artist: 'Artist',
    };
    idlingFetchMock.mockResolvedValue(jsonResponse({ songs: [] }));

    await putRadioSongFavoriteCloud(draft, false);

    expect(idlingFetchMock).toHaveBeenCalledWith(
      '/api/radio/favorites/songs',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ draft, saved: false }),
      })
    );
  });
});