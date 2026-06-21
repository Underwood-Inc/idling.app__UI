import type {
  RadioStationDefinition,
  RadioStationGenre,
  RadioStationGenreFilter,
  RadioStationGenreGroup,
  RadioStationGenreId,
} from './radioPlayer.types';

export const RADIO_STATION_GENRES: Record<RadioStationGenreId, RadioStationGenre> = {
  ambient: { id: 'ambient', label: 'Ambient' },
  classical: { id: 'classical', label: 'Classical' },
  community: { id: 'community', label: 'Community' },
  eclectic: { id: 'eclectic', label: 'Eclectic' },
  electronic: { id: 'electronic', label: 'Electronic' },
  jazz: { id: 'jazz', label: 'Jazz' },
  news: { id: 'news', label: 'News & talk' },
  public: { id: 'public', label: 'Public radio' },
};

const GENRE_ORDER: RadioStationGenreId[] = [
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
