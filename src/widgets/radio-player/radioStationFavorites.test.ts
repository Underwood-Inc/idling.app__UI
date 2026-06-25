import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
import {
  countFavoriteStationsInList,
  createRadioStationFavoriteNameSet,
  filterRadioStationsByFavorites,
  sortRadioStationsByFavoriteRecency,
  sortRadioStationsWithFavoritesFirst,
} from './radioStationFavorites';
import { listAvailableRadioStations } from './radioStationBrowse';

describe('radioStationFavorites', () => {
  test('filters to favorite stations when favorites-only mode is active', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const stations = listAvailableRadioStations(RADIO_STATION_DEFINITIONS, available);
    const favorites = createRadioStationFavoriteNameSet(['FIP', 'Radio Paradise']);

    expect(
      filterRadioStationsByFavorites(stations, favorites, true).map((station) => station.name)
    ).toEqual(['FIP', 'Radio Paradise']);
    expect(filterRadioStationsByFavorites(stations, favorites, false)).toEqual(stations);
  });

  test('counts how many visible stations are favorited', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const stations = listAvailableRadioStations(RADIO_STATION_DEFINITIONS, available);
    const favorites = createRadioStationFavoriteNameSet(['Jazz24']);

    expect(countFavoriteStationsInList(stations, favorites)).toBe(1);
  });

  test('sorts favorited stations ahead of the rest in browse order', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const stations = listAvailableRadioStations(RADIO_STATION_DEFINITIONS, available);

    expect(
      sortRadioStationsWithFavoritesFirst(stations, ['Radio Paradise', 'Jazz24']).map(
        (station) => station.name
      )
    ).toEqual(['Radio Paradise', 'Jazz24', 'FIP']);
  });

  test('sorts favorites-only results by recency order', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const stations = listAvailableRadioStations(RADIO_STATION_DEFINITIONS, available);
    const favorites = createRadioStationFavoriteNameSet(['Jazz24', 'FIP']);

    const filtered = filterRadioStationsByFavorites(stations, favorites, true);

    expect(
      sortRadioStationsByFavoriteRecency(filtered, ['FIP', 'Jazz24']).map((station) => station.name)
    ).toEqual(['FIP', 'Jazz24']);
  });
});
