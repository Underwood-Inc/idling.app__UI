import type { RadioPlayerHandle } from '@widgets/radio-player/radioPlayer.types';
import type { RadioStationDefinition } from '@widgets/radio-player/radioPlayer.types';
import {
  buildRadioMediaSessionMetadata,
  registerRadioMediaSessionHandlers,
  syncRadioMediaSessionMetadata,
  syncRadioMediaSessionPlaybackState,
} from '@widgets/radio-player/radioMediaSession';
import { findRadioStationDefinition } from '@widgets/radio-player/radioStationBrowse';
import { stationSupportsTrackMetadata } from '@widgets/radio-player/radioStationMetadata';
import { useEffect, useRef } from 'react';

export interface UseRadioMediaSessionOptions {
  handle: RadioPlayerHandle | null;
  stationDefinitions: RadioStationDefinition[];
  stationName: string | null;
  trackDisplay: string | null;
  isPlaying: boolean;
  onNextStation: () => void;
  onPreviousStation: () => void;
  onPlaybackSync: () => void;
}

export function useRadioMediaSession({
  handle,
  stationDefinitions,
  stationName,
  trackDisplay,
  isPlaying,
  onNextStation,
  onPreviousStation,
  onPlaybackSync,
}: UseRadioMediaSessionOptions): void {
  const onNextStationRef = useRef(onNextStation);
  const onPreviousStationRef = useRef(onPreviousStation);
  const onPlaybackSyncRef = useRef(onPlaybackSync);

  onNextStationRef.current = onNextStation;
  onPreviousStationRef.current = onPreviousStation;
  onPlaybackSyncRef.current = onPlaybackSync;

  useEffect(() => {
    if (!handle) {
      return undefined;
    }

    return registerRadioMediaSessionHandlers({
      onPlay: () => {
        void handle.play().then(() => {
          onPlaybackSyncRef.current();
        });
      },
      onPause: () => {
        handle.pause();
        onPlaybackSyncRef.current();
      },
      onPreviousTrack: () => {
        onPreviousStationRef.current();
      },
      onNextTrack: () => {
        onNextStationRef.current();
      },
    });
  }, [handle]);

  useEffect(() => {
    if (!handle || !stationName) {
      return;
    }

    const station = findRadioStationDefinition(stationDefinitions, stationName);
    const supportsTrackMetadata = stationSupportsTrackMetadata(stationName);
    const nowPlaying = handle.getNowPlaying();

    const metadata = buildRadioMediaSessionMetadata({
      stationName,
      stationBlurb: station?.blurb ?? null,
      nowPlaying: supportsTrackMetadata
        ? nowPlaying
        : {
            ...nowPlaying,
            artist: null,
            title: null,
            display: trackDisplay,
            streamTitle: trackDisplay,
          },
    });

    syncRadioMediaSessionMetadata(metadata);
    syncRadioMediaSessionPlaybackState(isPlaying);
  }, [handle, isPlaying, stationDefinitions, stationName, trackDisplay]);
}
