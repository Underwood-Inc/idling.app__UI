'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import {
  AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
  resolveAudioStreamTempoBpmDisplay,
} from '@widgets/radio-player/audioStreamTempo';
import type { AudioStreamTempoUniforms } from '@widgets/radio-player/audioStreamTempo.types';
import { useEffect, useState } from 'react';
import styles from './RadioPlayerBpmDisplay.module.css';

export interface UseAudioStreamTempoOptions {
  isPlaying: boolean;
}

export function useAudioStreamTempo({
  isPlaying,
}: UseAudioStreamTempoOptions): AudioStreamTempoUniforms {
  const { handle } = useRadioPlayer();
  const [tempo, setTempo] = useState<AudioStreamTempoUniforms>(AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS);

  useEffect(() => {
    if (!handle || !isPlaying) {
      setTempo(AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS);
      return undefined;
    }

    const sync = () => {
      setTempo(handle.getAudioStreamTempo());
    };

    sync();
    const timer = window.setInterval(sync, 200);

    return () => {
      window.clearInterval(timer);
    };
  }, [handle, isPlaying]);

  return tempo;
}

export interface RadioPlayerBpmDisplayProps {
  isPlaying: boolean;
}

export function RadioPlayerBpmDisplay({ isPlaying }: RadioPlayerBpmDisplayProps) {
  const tempo = useAudioStreamTempo({ isPlaying });
  const [playingSinceMs, setPlayingSinceMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isPlaying) {
      setPlayingSinceMs(null);
      return undefined;
    }

    setPlayingSinceMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 400);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying]);

  const playingForMs =
    isPlaying && playingSinceMs !== null ? Math.max(0, nowMs - playingSinceMs) : 0;

  const display = resolveAudioStreamTempoBpmDisplay({
    isPlaying,
    bpm: tempo.bpm,
    confidence: tempo.confidence,
    bassLevel: tempo.bassLevel,
    beatSampleCount: tempo.beatSampleCount,
    playingForMs,
  });

  return (
    <div
      className={styles.bpm}
      data-state={display.state}
      aria-label={display.description}
      data-testid="radio-player-bpm-display"
    >
      <span className={styles.bpm__label}>BPM</span>
      <span className={styles.bpm__value} aria-hidden="true">
        {display.label}
      </span>
    </div>
  );
}
