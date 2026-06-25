import { RADIO_STATION_DEFINITIONS } from './radioStationCatalog';
import {
  buildRadioStationNavigationOrder,
  resolveAdjacentRadioStation,
} from './radioStationNavigation';

describe('radioStationNavigation', () => {
  test('when favorites exist, navigation order lists favorites first then the remaining stations', () => {
    const order = buildRadioStationNavigationOrder({
      stations: RADIO_STATION_DEFINITIONS,
      availabilityByName: {
        Jazz24: { name: 'Jazz24', url: '', status: 'available' },
        FIP: { name: 'FIP', url: '', status: 'available' },
        CeolFM: { name: 'CeolFM', url: '', status: 'available' },
      },
      favoriteOrder: ['CeolFM', 'Jazz24'],
    });

    expect(order.slice(0, 2)).toEqual(['CeolFM', 'Jazz24']);
    expect(order).toContain('FIP');
  });

  test('when skipping stations, next and previous wrap around the navigation order', () => {
    const stationNames = ['Alpha', 'Bravo', 'Charlie'];

    expect(
      resolveAdjacentRadioStation({
        stationNames,
        currentStationName: 'Bravo',
        direction: 'next',
      })
    ).toBe('Charlie');

    expect(
      resolveAdjacentRadioStation({
        stationNames,
        currentStationName: 'Bravo',
        direction: 'previous',
      })
    ).toBe('Alpha');

    expect(
      resolveAdjacentRadioStation({
        stationNames,
        currentStationName: 'Charlie',
        direction: 'next',
      })
    ).toBe('Alpha');
  });
});
