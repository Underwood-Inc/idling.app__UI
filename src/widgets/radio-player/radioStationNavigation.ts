import type { RadioStationAvailabilityMap, RadioStationDefinition } from './radioPlayer.types';
import { getRadioStationAvailabilityStatus, listBrowsableRadioStations } from './radioStationBrowse';
import { sortRadioStationsWithFavoritesFirst } from './radioStationFavorites';

export type RadioStationNavigationDirection = 'next' | 'previous';

export interface BuildRadioStationNavigationOrderInput {
  stations: RadioStationDefinition[];
  availabilityByName: RadioStationAvailabilityMap;
  favoriteOrder: string[];
}

export interface ResolveAdjacentRadioStationInput {
  stationNames: string[];
  currentStationName: string;
  direction: RadioStationNavigationDirection;
}

export function buildRadioStationNavigationOrder({
  stations,
  availabilityByName,
  favoriteOrder,
}: BuildRadioStationNavigationOrderInput): string[] {
  const browsable = listBrowsableRadioStations(stations, availabilityByName);

  return sortRadioStationsWithFavoritesFirst(browsable, favoriteOrder)
    .filter(
      (station) =>
        getRadioStationAvailabilityStatus(availabilityByName, station.name) !== 'unreachable'
    )
    .map((station) => station.name);
}

export function resolveAdjacentRadioStation({
  stationNames,
  currentStationName,
  direction,
}: ResolveAdjacentRadioStationInput): string | null {
  if (stationNames.length === 0) {
    return null;
  }

  if (stationNames.length === 1) {
    return stationNames[0] ?? null;
  }

  const currentIndex = stationNames.indexOf(currentStationName);
  const startIndex = currentIndex === -1 ? 0 : currentIndex;
  const delta = direction === 'next' ? 1 : -1;
  const nextIndex = (startIndex + delta + stationNames.length) % stationNames.length;

  return stationNames[nextIndex] ?? null;
}
