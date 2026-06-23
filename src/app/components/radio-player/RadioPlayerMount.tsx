'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { mountRadioPlayer } from '@widgets/radio-player/radio-player';
import {
  logRadioPlayerUnavailable,
  probeBuiltInAndCustomRadioStations,
} from '@widgets/radio-player/probeRadioStations';
import { buildCustomAudioSourceCatalog } from '@widgets/radio-player/customAudioSourceBrowse';
import { RADIO_STATIONS } from '@widgets/radio-player/radioStationCatalog';
import type {
  RadioPlayerHandle,
  RadioStationCatalog,
  RadioStationDefinition,
} from '@widgets/radio-player/radioPlayer.types';
import { useEffect, useRef, useState } from 'react';
import { RadioPlayerBar } from './RadioPlayerBar';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerMountProps {
  autoplay?: boolean;
}

type RadioPlayerMountState = 'probing' | 'ready' | 'unavailable';

export interface RadioPlayerProbeSnapshot {
  availableStations: RadioStationCatalog;
  stationDefinitions: RadioStationDefinition[];
}

export function RadioPlayerMount({ autoplay = false }: RadioPlayerMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RadioPlayerHandle | null>(null);
  const {
    registerPlayer,
    unregisterPlayer,
    customSources,
    customSourcesLoaded,
    customSourcesRevision,
    stationDefinitions,
    setStationProbeFailures,
  } = useRadioPlayer();
  const [mountState, setMountState] = useState<RadioPlayerMountState>('probing');
  const [probeSnapshot, setProbeSnapshot] = useState<RadioPlayerProbeSnapshot | null>(null);

  useEffect(() => {
    if (!customSourcesLoaded) {
      return undefined;
    }

    let cancelled = false;
    setMountState('probing');
    setStationProbeFailures([]);

    const customCatalog = buildCustomAudioSourceCatalog(customSources);

    void probeBuiltInAndCustomRadioStations(RADIO_STATIONS, customCatalog).then((result) => {
      if (cancelled) {
        return;
      }

      setStationProbeFailures(result.failures);

      const stationCount = Object.keys(result.available).length;
      if (stationCount === 0) {
        logRadioPlayerUnavailable(result.failures);
        setProbeSnapshot(null);
        setMountState('unavailable');
        return;
      }

      if (result.failures.length > 0) {
        console.warn(
          '[Idling Radio] Some sources are unreachable and were omitted from the player:',
          result.failures
        );
      }

      setProbeSnapshot({
        availableStations: result.available,
        stationDefinitions,
      });
      setMountState('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [customSources, customSourcesLoaded, customSourcesRevision, setStationProbeFailures, stationDefinitions]);

  useEffect(() => {
    if (mountState !== 'ready' || !probeSnapshot) {
      return undefined;
    }

    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    document.body.classList.add('has-radio-player');
    playerRef.current = mountRadioPlayer(host, {
      autoplay,
      stations: probeSnapshot.availableStations,
      stationDefinitions: probeSnapshot.stationDefinitions,
      headless: true,
    });
    registerPlayer(playerRef.current);

    return () => {
      unregisterPlayer();
      playerRef.current?.destroy();
      playerRef.current = null;
      document.body.classList.remove('has-radio-player');
      document.documentElement.style.removeProperty('--irp-bar-height');
      document.documentElement.style.removeProperty('--irp-dock-height');
    };
  }, [
    autoplay,
    mountState,
    probeSnapshot,
    registerPlayer,
    unregisterPlayer,
  ]);

  if (mountState !== 'ready') {
    return null;
  }

  return (
    <>
      <div ref={hostRef} className={styles.engineHost} data-testid="radio-player-host" aria-hidden="true" />
      <RadioPlayerBar />
    </>
  );
}
