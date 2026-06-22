'use client';

import type {
  AddCustomAudioSourceUrlInput,
  CustomAudioSourceRecord,
  RadioPlayerHandle,
  RadioStationDefinition,
  RadioStationGenreId,
} from '@widgets/radio-player/radioPlayer.types';
import {
  createCustomAudioSourceFromUrl,
  listReservedAudioSourceNames,
  mergeCustomAudioSourcesIntoDefinitions,
  normalizeCustomAudioSourceRecord,
  updateCustomAudioSourceGenre,
} from '@widgets/radio-player/customAudioSourceBrowse';
import {
  deleteCustomAudioSource,
  listCustomAudioSources,
  putCustomAudioSource,
} from '@widgets/radio-player/customAudioSourceStore';
import { RADIO_STATION_DEFINITIONS } from '@widgets/radio-player/radioStationCatalog';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AddCustomAudioSourceResult =
  | { ok: true }
  | { ok: false; message: string };

export interface RadioPlayerContextValue {
  handle: RadioPlayerHandle | null;
  isAvailable: boolean;
  registerPlayer: (player: RadioPlayerHandle) => void;
  unregisterPlayer: () => void;
  customSources: CustomAudioSourceRecord[];
  customSourcesLoaded: boolean;
  customSourcesRevision: number;
  stationDefinitions: RadioStationDefinition[];
  addCustomSource: (input: AddCustomAudioSourceUrlInput) => Promise<AddCustomAudioSourceResult>;
  removeCustomSource: (id: string) => Promise<void>;
  updateCustomSourceGenre: (id: string, genre: RadioStationGenreId) => Promise<void>;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export interface RadioPlayerProviderProps {
  children: ReactNode;
}

export function RadioPlayerProvider({ children }: RadioPlayerProviderProps) {
  const [handle, setHandle] = useState<RadioPlayerHandle | null>(null);
  const [customSources, setCustomSources] = useState<CustomAudioSourceRecord[]>([]);
  const [customSourcesLoaded, setCustomSourcesLoaded] = useState(false);
  const [customSourcesRevision, setCustomSourcesRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void listCustomAudioSources()
      .then((records) => {
        if (cancelled) {
          return;
        }

        setCustomSources(records.map(normalizeCustomAudioSourceRecord));
        setCustomSourcesLoaded(true);
      })
      .catch((error) => {
        console.warn('[Idling Radio] Failed to load custom audio sources from IndexedDB.', error);
        if (!cancelled) {
          setCustomSourcesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stationDefinitions = useMemo(
    () => mergeCustomAudioSourcesIntoDefinitions(RADIO_STATION_DEFINITIONS, customSources),
    [customSources]
  );

  const registerPlayer = useCallback((player: RadioPlayerHandle) => {
    setHandle(player);
  }, []);

  const unregisterPlayer = useCallback(() => {
    setHandle(null);
  }, []);

  const addCustomSource = useCallback(
    async (input: AddCustomAudioSourceUrlInput): Promise<AddCustomAudioSourceResult> => {
      const reservedNames = listReservedAudioSourceNames(RADIO_STATION_DEFINITIONS, customSources);
      const result = createCustomAudioSourceFromUrl(input.url, reservedNames);

      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      try {
        await putCustomAudioSource(result.record);
        setCustomSources((current) =>
          [...current, result.record].sort((left, right) => left.name.localeCompare(right.name))
        );
        setCustomSourcesRevision((revision) => revision + 1);
        return { ok: true };
      } catch (error) {
        console.warn('[Idling Radio] Failed to save custom audio source.', error);
        return { ok: false, message: 'Could not save this source in this browser.' };
      }
    },
    [customSources]
  );

  const removeCustomSource = useCallback(async (id: string) => {
    try {
      await deleteCustomAudioSource(id);
      setCustomSources((current) => current.filter((source) => source.id !== id));
      setCustomSourcesRevision((revision) => revision + 1);
    } catch (error) {
      console.warn('[Idling Radio] Failed to delete custom audio source.', error);
    }
  }, []);

  const updateCustomSourceGenre = useCallback(
    async (id: string, genre: RadioStationGenreId) => {
      const existing = customSources.find((source) => source.id === id);
      if (!existing) {
        return;
      }

      const result = updateCustomAudioSourceGenre(existing, genre);
      if (!result.ok) {
        return;
      }

      try {
        await putCustomAudioSource(result.record);
        setCustomSources((current) =>
          current
            .map((source) => (source.id === id ? result.record : source))
            .sort((left, right) => left.name.localeCompare(right.name))
        );
        setCustomSourcesRevision((revision) => revision + 1);
      } catch (error) {
        console.warn('[Idling Radio] Failed to update custom audio source genre.', error);
      }
    },
    [customSources]
  );

  const value = useMemo<RadioPlayerContextValue>(
    () => ({
      handle,
      isAvailable: handle !== null,
      registerPlayer,
      unregisterPlayer,
      customSources,
      customSourcesLoaded,
      customSourcesRevision,
      stationDefinitions,
      addCustomSource,
      removeCustomSource,
      updateCustomSourceGenre,
    }),
    [
      handle,
      registerPlayer,
      unregisterPlayer,
      customSources,
      customSourcesLoaded,
      customSourcesRevision,
      stationDefinitions,
      addCustomSource,
      removeCustomSource,
      updateCustomSourceGenre,
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
