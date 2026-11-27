import {
  listRadioStationFavoriteNames,
  setRadioStationFavorite,
} from '@widgets/radio-player/radioStationFavoritesIndexedDb';
import { createRadioStationFavoriteNameSet } from '@widgets/radio-player/radioStationFavorites';
import { replaceRadioStationFavoritesCache } from '@widgets/radio-player/radioFavoritesIndexedDbCache';
import {
  fetchRadioStationFavoritesCloud,
  putRadioStationFavoriteCloud,
} from '@widgets/radio-player/radioFavoritesHttpClient';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseRadioStationFavoritesResult {
  favoriteStationNames: string[];
  favoriteStationNameSet: Set<string>;
  favoritesLoaded: boolean;
  isFavorite: (stationName: string) => boolean;
  toggleFavorite: (stationName: string) => Promise<void>;
}

export function useRadioStationFavorites(
  userId: string | null
): UseRadioStationFavoritesResult {
  const [favoriteStationNames, setFavoriteStationNames] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFavoritesLoaded(false);

    if (userId) {
      void (async () => {
        try {
          const stations = await fetchRadioStationFavoritesCloud();
          const names = stations.map((station) => station.stationName);
          if (!cancelled) {
            setFavoriteStationNames(names);
            setFavoritesLoaded(true);
          }
          void replaceRadioStationFavoritesCache(stations);
        } catch {
          const names = await listRadioStationFavoriteNames();
          if (!cancelled) {
            setFavoriteStationNames(names);
            setFavoritesLoaded(true);
          }
        }
      })();
    } else {
      void (async () => {
        const names = await listRadioStationFavoriteNames();
        if (!cancelled) {
          setFavoriteStationNames(names);
          setFavoritesLoaded(true);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const favoriteStationNameSet = useMemo(
    () => createRadioStationFavoriteNameSet(favoriteStationNames),
    [favoriteStationNames]
  );

  const isFavorite = useCallback(
    (stationName: string) => favoriteStationNameSet.has(stationName),
    [favoriteStationNameSet]
  );

  const toggleFavorite = useCallback(
    async (stationName: string) => {
      let nextIsFavorite = false;

      setFavoriteStationNames((current) => {
        nextIsFavorite = !current.includes(stationName);
        if (nextIsFavorite) {
          return [stationName, ...current.filter((name) => name !== stationName)];
        }

        return current.filter((name) => name !== stationName);
      });

      try {
        if (userId) {
          const stations = await putRadioStationFavoriteCloud(stationName, nextIsFavorite);
          const names = stations.map((station) => station.stationName);
          setFavoriteStationNames(names);
          void replaceRadioStationFavoritesCache(stations);
        } else {
          const names = await setRadioStationFavorite(stationName, nextIsFavorite);
          setFavoriteStationNames(names);
        }
      } catch {
        const names = await listRadioStationFavoriteNames();
        setFavoriteStationNames(names);
      }
    },
    [userId]
  );

  return {
    favoriteStationNames,
    favoriteStationNameSet,
    favoritesLoaded,
    isFavorite,
    toggleFavorite,
  };
}