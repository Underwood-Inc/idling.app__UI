'use client';

import type {
  RadioPlayerHandle,
  RadioStationAvailabilityMap,
  RadioStationAvailabilityState,
  RadioStationCatalog,
  RadioStationDefinition,
} from '@widgets/radio-player/radioPlayer.types';
import {
  buildRadioStationProbeCatalog,
  RADIO_STATION_DEFINITIONS,
  RADIO_STATIONS,
} from '@widgets/radio-player/radioStationCatalog';
import {
  rerunStationAvailabilityChecks,
  runStationAvailabilityChecks,
  syncStationAvailabilityWithCatalog,
} from '@widgets/radio-player/probeRadioStations';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface RadioPlayerContextValue {
  handle: RadioPlayerHandle | null;
  isAvailable: boolean;
  registerPlayer: (player: RadioPlayerHandle) => void;
  unregisterPlayer: () => void;
  stationDefinitions: RadioStationDefinition[];
  stationAvailabilityByName: RadioStationAvailabilityMap;
  retryStationAvailability: (stationNames: string[]) => void;
  retryUnreachableStations: () => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export interface RadioPlayerProviderProps {
  children: ReactNode;
}

function buildProbeCatalog(): RadioStationCatalog {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  return buildRadioStationProbeCatalog(RADIO_STATIONS, hostname, true);
}

function buildUnreachableRetryCatalog(
  availabilityByName: RadioStationAvailabilityMap
): RadioStationCatalog {
  const catalog: RadioStationCatalog = {};

  Object.values(availabilityByName).forEach((entry) => {
    if (entry.status === 'unreachable') {
      catalog[entry.name] = entry.url;
    }
  });

  return catalog;
}

export function RadioPlayerProvider({ children }: RadioPlayerProviderProps) {
  const [handle, setHandle] = useState<RadioPlayerHandle | null>(null);
  const [stationAvailabilityByName, setStationAvailabilityByName] =
    useState<RadioStationAvailabilityMap>({});
  const availabilityByNameRef = useRef(stationAvailabilityByName);

  availabilityByNameRef.current = stationAvailabilityByName;

  const applyStationAvailabilityUpdate = useCallback((update: RadioStationAvailabilityState) => {
    setStationAvailabilityByName((current) => ({
      ...current,
      [update.name]: update,
    }));
  }, []);

  useEffect(() => {
    const mergedCatalog = buildProbeCatalog();
    const { nextMap, catalogToProbe } = syncStationAvailabilityWithCatalog(
      availabilityByNameRef.current,
      mergedCatalog
    );

    const mapChanged =
      Object.keys(catalogToProbe).length > 0 ||
      Object.keys(nextMap).length !== Object.keys(availabilityByNameRef.current).length;

    if (mapChanged) {
      setStationAvailabilityByName(nextMap);
    }

    if (Object.keys(catalogToProbe).length === 0) {
      return undefined;
    }

    const stopProbe = runStationAvailabilityChecks(catalogToProbe, {
      onUpdate: applyStationAvailabilityUpdate,
    });

    return () => {
      stopProbe();
    };
  }, [applyStationAvailabilityUpdate]);

  const retryStationAvailability = useCallback((stationNames: string[]) => {
    const catalog: RadioStationCatalog = {};

    stationNames.forEach((stationName) => {
      const entry = availabilityByNameRef.current[stationName];
      if (entry?.status === 'unreachable') {
        catalog[stationName] = entry.url;
      }
    });

    if (Object.keys(catalog).length === 0) {
      return;
    }

    rerunStationAvailabilityChecks(catalog, {
      onUpdate: applyStationAvailabilityUpdate,
    });
  }, [applyStationAvailabilityUpdate]);

  const retryUnreachableStations = useCallback(() => {
    const catalog = buildUnreachableRetryCatalog(availabilityByNameRef.current);

    if (Object.keys(catalog).length === 0) {
      return;
    }

    rerunStationAvailabilityChecks(catalog, {
      onUpdate: applyStationAvailabilityUpdate,
    });
  }, [applyStationAvailabilityUpdate]);

  const registerPlayer = useCallback((player: RadioPlayerHandle) => {
    setHandle(player);
  }, []);

  const unregisterPlayer = useCallback(() => {
    setHandle(null);
  }, []);

  const value = useMemo<RadioPlayerContextValue>(
    () => ({
      handle,
      isAvailable: handle !== null,
      registerPlayer,
      unregisterPlayer,
      stationDefinitions: RADIO_STATION_DEFINITIONS,
      stationAvailabilityByName,
      retryStationAvailability,
      retryUnreachableStations,
    }),
    [
      handle,
      registerPlayer,
      unregisterPlayer,
      stationAvailabilityByName,
      retryStationAvailability,
      retryUnreachableStations,
    ]
  );

  return (
    <RadioPlayerContext.Provider value={value}>{children}</RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer(): RadioPlayerContextValue {
  const context = useContext(RadioPlayerContext);

  if (!context) {
    throw new Error('useRadioPlayer must be used within RadioPlayerProvider');
  }

  return context;
}
