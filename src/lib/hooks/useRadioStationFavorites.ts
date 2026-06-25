import {
  listRadioStationFavoriteNames,
  setRadioStationFavorite,
} from '@widgets/radio-player/radioStationFavoritesIndexedDb';
import { createRadioStationFavoriteNameSet } from '@widgets/radio-player/radioStationFavorites';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseRadioStationFavoritesResult {
  favoriteStationNames: string[];
  favoriteStationNameSet: Set<string>;
  favoritesLoaded: boolean;
  isFavorite: (stationName: string) => boolean;
  toggleFavorite: (stationName: string) => Promise<void>;
}

export function useRadioStationFavorites(): UseRadioStationFavoritesResult {
  const [favoriteStationNames, setFavoriteStationNames] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const names = await listRadioStationFavoriteNames();
      if (!cancelled) {
        setFavoriteStationNames(names);
        setFavoritesLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteStationNameSet = useMemo(
    () => createRadioStationFavoriteNameSet(favoriteStationNames),
    [favoriteStationNames]
  );

  const isFavorite = useCallback(
    (stationName: string) => favoriteStationNameSet.has(stationName),
    [favoriteStationNameSet]
  );

  const toggleFavorite = useCallback(async (stationName: string) => {
    let nextIsFavorite = false;

    setFavoriteStationNames((current) => {
      nextIsFavorite = !current.includes(stationName);
      if (nextIsFavorite) {
        return [stationName, ...current.filter((name) => name !== stationName)];
      }

      return current.filter((name) => name !== stationName);
    });

    try {
      const names = await setRadioStationFavorite(stationName, nextIsFavorite);
      setFavoriteStationNames(names);
    } catch {
      const names = await listRadioStationFavoriteNames();
      setFavoriteStationNames(names);
    }
  }, []);

  return {
    favoriteStationNames,
    favoriteStationNameSet,
    favoritesLoaded,
    isFavorite,
    toggleFavorite,
  };
}
