import type { RadioStationDefinition } from './radioPlayer.types';

export function createRadioStationFavoriteNameSet(favoriteNames: string[]): Set<string> {
  return new Set(favoriteNames);
}

export function isRadioStationFavorite(
  favoriteNames: Set<string>,
  stationName: string
): boolean {
  return favoriteNames.has(stationName);
}

export function countFavoriteStationsInList(
  stations: RadioStationDefinition[],
  favoriteNames: Set<string>
): number {
  return stations.reduce(
    (count, station) => (favoriteNames.has(station.name) ? count + 1 : count),
    0
  );
}

export function filterRadioStationsByFavorites(
  stations: RadioStationDefinition[],
  favoriteNames: Set<string>,
  favoritesOnly: boolean
): RadioStationDefinition[] {
  if (!favoritesOnly) {
    return stations;
  }

  return stations.filter((station) => favoriteNames.has(station.name));
}

export function sortRadioStationsWithFavoritesFirst(
  stations: RadioStationDefinition[],
  favoriteOrder: string[]
): RadioStationDefinition[] {
  if (!favoriteOrder.length) {
    return stations;
  }

  const orderMap = new Map(favoriteOrder.map((name, index) => [name, index]));

  return [...stations].sort((left, right) => {
    const leftIndex = orderMap.get(left.name);
    const rightIndex = orderMap.get(right.name);

    if (leftIndex === undefined && rightIndex === undefined) {
      return left.name.localeCompare(right.name);
    }

    if (leftIndex === undefined) {
      return 1;
    }

    if (rightIndex === undefined) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

export function sortRadioStationsByFavoriteRecency(
  stations: RadioStationDefinition[],
  favoriteOrder: string[]
): RadioStationDefinition[] {
  const orderMap = new Map(favoriteOrder.map((name, index) => [name, index]));

  return [...stations].sort((left, right) => {
    const leftIndex = orderMap.get(left.name) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.name) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.name.localeCompare(right.name);
  });
}
