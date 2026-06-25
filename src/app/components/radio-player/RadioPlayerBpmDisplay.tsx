'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import {
  AUDIO_STREAM_TEMPO_DEFAULT_UNIFORMS,
  describeAudioStreamTempoBpm,
  formatAudioStreamTempoBpmLabel,
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
    const timer = window.setInterval(sync, 250);

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
  const value = formatAudioStreamTempoBpmLabel({
    bpm: tempo.bpm,
    confidence: tempo.confidence,
    isPlaying,
  });

  return (
    <div
      className={styles.bpm}
      data-confidence={
        !isPlaying ? 'idle' : tempo.confidence >= 0.35 ? 'high' : tempo.confidence >= 0.12 ? 'mid' : 'low'
      }
      aria-label={describeAudioStreamTempoBpm({
        bpm: tempo.bpm,
        confidence: tempo.confidence,
        isPlaying,
      })}
      data-testid="radio-player-bpm-display"
    >
      <span className={styles.bpm__label}>BPM</span>
      <span className={styles.bpm__value} aria-hidden="true">
        {value}
      </span>
    </div>
  );
}
