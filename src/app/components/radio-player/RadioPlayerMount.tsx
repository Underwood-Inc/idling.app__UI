'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { mountRadioPlayer } from '@widgets/radio-player/radio-player';
import { logRadioPlayerUnavailable } from '@widgets/radio-player/probeRadioStations';
import { buildRadioStationCatalog } from '@widgets/radio-player/radioStationCatalog';
import { countStationsByAvailabilityStatus } from '@widgets/radio-player/radioStationBrowse';
import { useEffect, useRef } from 'react';
import { RadioPlayerBar } from './RadioPlayerBar';
import styles from './RadioPlayerBar.module.css';

export interface RadioPlayerMountProps {
  autoplay?: boolean;
}

export function RadioPlayerMount({ autoplay = false }: RadioPlayerMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof mountRadioPlayer> | null>(null);
  const {
    registerPlayer,
    unregisterPlayer,
    stationDefinitions,
    stationAvailabilityByName,
  } = useRadioPlayer();

  useEffect(() => {
    const availabilityEntries = Object.values(stationAvailabilityByName);
    if (availabilityEntries.length === 0) {
      return;
    }

    const pendingCount = countStationsByAvailabilityStatus(stationAvailabilityByName, 'pending');
    if (pendingCount > 0) {
      return;
    }

    const availableCount = countStationsByAvailabilityStatus(stationAvailabilityByName, 'available');
    if (availableCount === 0) {
      const failures = availabilityEntries
        .filter((entry) => entry.status === 'unreachable')
        .map((entry) => ({
          name: entry.name,
          url: entry.url,
          reason: entry.reason ?? 'Stream failed to load',
        }));
      logRadioPlayerUnavailable(failures);
    }
  }, [stationAvailabilityByName]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    document.body.classList.add('has-radio-player');
    const stations = buildRadioStationCatalog(stationDefinitions);
    playerRef.current = mountRadioPlayer(host, {
      autoplay,
      stations,
      stationDefinitions,
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
  }, [autoplay, registerPlayer, stationDefinitions, unregisterPlayer]);

  return (
    <>
      <div ref={hostRef} className={styles.engineHost} data-testid="radio-player-host" aria-hidden="true" />
      <RadioPlayerBar />
    </>
  );
}
