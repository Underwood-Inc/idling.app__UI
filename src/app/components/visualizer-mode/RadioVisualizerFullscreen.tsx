'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import type AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useEffect, useRef } from 'react';
import type { RadioVisualizerPreset } from '@widgets/radio-player/radioVisualizerPresets';
import {
  RADIO_VISUALIZER_BASE_OPTIONS,
} from '@widgets/radio-player/radioVisualizerPresets';
import styles from './VisualizerMode.module.css';

export interface RadioVisualizerFullscreenProps {
  isActive: boolean;
  preset: RadioVisualizerPreset;
}

export function RadioVisualizerFullscreen({ isActive, preset }: RadioVisualizerFullscreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const analyzerRef = useRef<AudioMotionAnalyzer | null>(null);
  const { handle, isAvailable } = useRadioPlayer();

  useEffect(() => {
    if (!isActive || !isAvailable || !handle) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      await handle.play();

      const analyser = handle.getAnalyser();
      const audioCtx = handle.getAudioContext();

      if (!analyser || !audioCtx || cancelled) {
        return;
      }

      analyser.minDecibels = RADIO_VISUALIZER_BASE_OPTIONS.minDecibels ?? -88;
      analyser.maxDecibels = RADIO_VISUALIZER_BASE_OPTIONS.maxDecibels ?? -22;

      const AudioMotion = (await import('audiomotion-analyzer')).default;
      if (cancelled) {
        return;
      }

      const instance = new AudioMotion(container, {
        ...RADIO_VISUALIZER_BASE_OPTIONS,
        ...preset.options,
        source: analyser,
        audioCtx,
        connectSpeakers: false,
      });

      if (cancelled) {
        instance.destroy();
        return;
      }

      analyzerRef.current = instance;
    })();

    return () => {
      cancelled = true;
      analyzerRef.current?.destroy();
      analyzerRef.current = null;
    };
  }, [handle, isActive, isAvailable, preset]);

  if (!isActive) {
    return null;
  }

  const isRadial = preset.options.radial === true;

  return (
    <div className={styles.spectrumFrame}>
      <div
        ref={containerRef}
        className={styles.spectrum}
        data-radial={isRadial ? 'true' : 'false'}
        data-testid="radio-visualizer-fullscreen"
        aria-hidden="true"
      />
    </div>
  );
}
