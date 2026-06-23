import type { HumanFriendlySearchQuery } from '@molecules/humanFriendlySearch/humanFriendlySearch.types';
import { matchesHumanFriendlySearch } from '@molecules/humanFriendlySearch/matchHumanFriendlySearch';
import type {
  RadioStationAvailabilityMap,
  RadioStationAvailabilityStatus,
  RadioStationDefinition,
  RadioStationGenre,
  RadioStationGenreFilter,
  RadioStationGenreGroup,
  RadioStationGenreId,
  RadioStationProbeFailure,
} from './radioPlayer.types';

export const RADIO_STATION_GENRES: Record<RadioStationGenreId, RadioStationGenre> = {
  ambient: { id: 'ambient', label: 'Ambient' },
  classical: { id: 'classical', label: 'Classical' },
  community: { id: 'community', label: 'Community' },
  custom: { id: 'custom', label: 'Custom' },
  eclectic: { id: 'eclectic', label: 'Eclectic' },
  electronic: { id: 'electronic', label: 'Electronic' },
  jazz: { id: 'jazz', label: 'Jazz' },
  news: { id: 'news', label: 'News & talk' },
  public: { id: 'public', label: 'Public radio' },
};

const GENRE_ORDER: RadioStationGenreId[] = [
  'custom',
  'eclectic',
  'jazz',
  'classical',
  'electronic',
  'ambient',
  'public',
  'news',
  'community',
];

export function getRadioStationGenre(genreId: RadioStationGenreId): RadioStationGenre {
  return RADIO_STATION_GENRES[genreId];
}

export function listRadioStationGenres(): RadioStationGenre[] {
  return GENRE_ORDER.map((genreId) => getRadioStationGenre(genreId));
}

export function groupRadioStationsByGenre(
  definitions: RadioStationDefinition[],
  availableNames: string[]
): RadioStationGenreGroup[] {
  const available = new Set(availableNames);
  const grouped = new Map<RadioStationGenreId, RadioStationDefinition[]>();

  definitions.forEach((definition) => {
    if (!available.has(definition.name)) {
      return;
    }

    const bucket = grouped.get(definition.genre) ?? [];
    bucket.push(definition);
    grouped.set(definition.genre, bucket);
  });

  return GENRE_ORDER.flatMap((genreId) => {
    const stations = grouped.get(genreId);
    if (!stations?.length) {
      return [];
    }

    return [
      {
        genre: getRadioStationGenre(genreId),
        stations: stations.sort((left, right) => left.name.localeCompare(right.name)),
      },
    ];
  });
}

export function listAvailableRadioStations(
  definitions: RadioStationDefinition[],
  availableNames: string[]
): RadioStationDefinition[] {
  const available = new Set(availableNames);

  return definitions
    .filter((definition) => available.has(definition.name))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getRadioStationAvailabilityStatus(
  availabilityByName: RadioStationAvailabilityMap,
  stationName: string
): RadioStationAvailabilityStatus {
  return availabilityByName[stationName]?.status ?? 'pending';
}

export function buildRadioStationProbeFailureMap(
  failures: RadioStationProbeFailure[]
): Map<string, RadioStationProbeFailure> {
  return new Map(failures.map((failure) => [failure.name, failure]));
}

export function listBrowsableRadioStations(
  definitions: RadioStationDefinition[],
  availabilityByName: RadioStationAvailabilityMap
): RadioStationDefinition[] {
  return definitions
    .filter((definition) => {
      const status = getRadioStationAvailabilityStatus(availabilityByName, definition.name);
      return status === 'available' || status === 'pending';
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function listUnreachableRadioStations(
  definitions: RadioStationDefinition[],
  failures: RadioStationProbeFailure[]
): RadioStationDefinition[] {
  const unreachableNames = new Set(failures.map((failure) => failure.name));

  return definitions
    .filter((definition) => unreachableNames.has(definition.name))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function listUnreachableRadioStationsFromAvailability(
  definitions: RadioStationDefinition[],
  availabilityByName: RadioStationAvailabilityMap
): RadioStationDefinition[] {
  return definitions
    .filter(
      (definition) =>
        getRadioStationAvailabilityStatus(availabilityByName, definition.name) === 'unreachable'
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function countStationsByAvailabilityStatus(
  availabilityByName: RadioStationAvailabilityMap,
  status: RadioStationAvailabilityStatus
): number {
  return Object.values(availabilityByName).filter((entry) => entry.status === status).length;
}

export function listRadioStationGenreFiltersForStations(
  stations: RadioStationDefinition[]
): RadioStationGenreFilter[] {
  const counts = new Map<RadioStationGenreId, number>();

  stations.forEach((station) => {
    counts.set(station.genre, (counts.get(station.genre) ?? 0) + 1);
  });

  return GENRE_ORDER.flatMap((genreId) => {
    const count = counts.get(genreId);
    if (!count) {
      return [];
    }

    return [{ genre: getRadioStationGenre(genreId), count }];
  });
}

export function listRadioStationGenreFiltersFromAvailability(
  definitions: RadioStationDefinition[],
  availabilityByName: RadioStationAvailabilityMap
): RadioStationGenreFilter[] {
  return listRadioStationGenreFiltersForStations(
    listBrowsableRadioStations(definitions, availabilityByName)
  );
}

export function listRadioStationGenreFilters(
  definitions: RadioStationDefinition[],
  availableNames: string[]
): RadioStationGenreFilter[] {
  const stations = listAvailableRadioStations(definitions, availableNames);
  const counts = new Map<RadioStationGenreId, number>();

  stations.forEach((station) => {
    counts.set(station.genre, (counts.get(station.genre) ?? 0) + 1);
  });

  return GENRE_ORDER.flatMap((genreId) => {
    const count = counts.get(genreId);
    if (!count) {
      return [];
    }

    return [{ genre: getRadioStationGenre(genreId), count }];
  });
}

export function filterRadioStationsByGenre(
  stations: RadioStationDefinition[],
  genreId: RadioStationGenreId | null
): RadioStationDefinition[] {
  if (!genreId) {
    return stations;
  }

  return stations.filter((station) => station.genre === genreId);
}

export function findRadioStationDefinition(
  definitions: RadioStationDefinition[],
  stationName: string
): RadioStationDefinition | undefined {
  return definitions.find((definition) => definition.name === stationName);
}

export function isRadioStationInGenreFilter(
  stations: RadioStationDefinition[],
  stationName: string,
  genreId: RadioStationGenreId | null
): boolean {
  return filterRadioStationsByGenre(stations, genreId).some(
    (station) => station.name === stationName
  );
}

export function buildRadioStationSearchHaystack(station: RadioStationDefinition): string {
  const genre = getRadioStationGenre(station.genre);
  return [station.name, station.blurb, genre.label, genre.id, station.regionFlag]
    .join(' ')
    .toLowerCase();
}

export function matchesRadioStationSearch(
  station: RadioStationDefinition,
  query: HumanFriendlySearchQuery
): boolean {
  if (!query.terms.length) {
    return true;
  }

  const haystack = buildRadioStationSearchHaystack(station);
  return query.terms.some((term) => {
    if (term.kind === 'hashtag') {
      return (
        station.genre === term.value ||
        getRadioStationGenre(station.genre).label.toLowerCase().includes(term.value) ||
        haystack.includes(term.value)
      );
    }

    return matchesHumanFriendlySearch(haystack, {
      raw: query.raw,
      terms: [term],
    });
  });
}

export function filterRadioStationsBySearch(
  stations: RadioStationDefinition[],
  query: HumanFriendlySearchQuery
): RadioStationDefinition[] {
  if (!query.terms.length) {
    return stations;
  }

  return stations.filter((station) => matchesRadioStationSearch(station, query));
}
