import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
import {
  filterRadioStationsByGenre,
  groupRadioStationsByGenre,
  listAvailableRadioStations,
  listRadioStationGenreFilters,
} from './radioStationBrowse';

describe('radioStationBrowse', () => {
  test('groups available stations by genre in catalog order', () => {
    const available = RADIO_STATION_DEFINITIONS.map((definition) => definition.name);
    const groups = groupRadioStationsByGenre(RADIO_STATION_DEFINITIONS, available);

    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]?.genre.id).toBe('eclectic');
    expect(groups.some((group) => group.genre.id === 'jazz')).toBe(true);
  });

  test('omits stations that are not available', () => {
    const groups = groupRadioStationsByGenre(RADIO_STATION_DEFINITIONS, ['Jazz24']);

    expect(groups).toEqual([
      expect.objectContaining({
        genre: expect.objectContaining({ id: 'jazz' }),
        stations: [expect.objectContaining({ name: 'Jazz24' })],
      }),
    ]);
  });

  test('lists available stations alphabetically', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const stations = listAvailableRadioStations(RADIO_STATION_DEFINITIONS, available);

    expect(stations.map((station) => station.name)).toEqual([
      'FIP',
      'Jazz24',
      'Radio Paradise',
    ]);
  });

  test('lists genre filters for genres that have available stations', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const filters = listRadioStationGenreFilters(RADIO_STATION_DEFINITIONS, available);

    expect(filters.map((filter) => filter.genre.id)).toEqual(['eclectic', 'jazz']);
    expect(filters.find((filter) => filter.genre.id === 'jazz')?.count).toBe(1);
  });

  test('filters stations by genre when a genre is selected', () => {
    const available = ['Jazz24', 'FIP', 'Radio Paradise'];
    const stations = listAvailableRadioStations(RADIO_STATION_DEFINITIONS, available);
    const jazzOnly = filterRadioStationsByGenre(stations, 'jazz');

    expect(jazzOnly.map((station) => station.name)).toEqual(['Jazz24']);
    expect(filterRadioStationsByGenre(stations, null)).toEqual(stations);
  });
});
