'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import type AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useEffect, useRef } from 'react';
import type { RadioVisualizerPreset } from '@widgets/radio-player/radioVisualizerPresets';
import { RADIO_VISUALIZER_BASE_OPTIONS } from '@widgets/radio-player/radioVisualizerPresets';
import { resolveRadioFullscreenLinearBoost, resolveRadioFullscreenRadialRadius } from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import styles from './VisualizerMode.module.css';

export interface RadioVisualizerFullscreenProps {
  isActive: boolean;
  enabled: boolean;
  opacity: number;
  barHeight: number;
  preset: RadioVisualizerPreset;
}

function syncAnalyzerCanvasSize(
  container: HTMLElement,
  instance: AudioMotionAnalyzer
): void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width > 0 && height > 0) {
    instance.setCanvasSize(width, height);
  }
}

export function RadioVisualizerFullscreen({
  isActive,
  enabled,
  opacity,
  barHeight,
  preset,
}: RadioVisualizerFullscreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const analyzerRef = useRef<AudioMotionAnalyzer | null>(null);
  const barHeightRef = useRef(barHeight);
  const { handle, isAvailable } = useRadioPlayer();

  barHeightRef.current = barHeight;

  useEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

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

      const baseLinearBoost = RADIO_VISUALIZER_BASE_OPTIONS.linearBoost ?? 1.45;
      const isRadial = preset.options.radial === true;
      const instance = new AudioMotion(container, {
        ...RADIO_VISUALIZER_BASE_OPTIONS,
        ...preset.options,
        ...(isRadial
          ? {
              radius: resolveRadioFullscreenRadialRadius({
                presetRadius: preset.options.radius,
                channelLayout: preset.options.channelLayout,
                spectrumBarHeight: barHeightRef.current,
              }),
            }
          : {}),
        linearBoost: resolveRadioFullscreenLinearBoost(baseLinearBoost, barHeightRef.current),
        source: analyser,
        audioCtx,
        connectSpeakers: false,
      });

      if (cancelled) {
        instance.destroy();
        return;
      }

      analyzerRef.current = instance;
      syncAnalyzerCanvasSize(container, instance);

      resizeObserver = new ResizeObserver(() => {
        syncAnalyzerCanvasSize(container, instance);
      });
      resizeObserver.observe(container);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      analyzerRef.current?.destroy();
      analyzerRef.current = null;
    };
  }, [enabled, handle, isActive, isAvailable, preset]);

  useEffect(() => {
    const instance = analyzerRef.current;
    if (!instance) {
      return;
    }

    const baseLinearBoost = RADIO_VISUALIZER_BASE_OPTIONS.linearBoost ?? 1.45;
    instance.linearBoost = resolveRadioFullscreenLinearBoost(baseLinearBoost, barHeight);

    if (preset.options.radial === true) {
      instance.radius = resolveRadioFullscreenRadialRadius({
        presetRadius: preset.options.radius,
        channelLayout: preset.options.channelLayout,
        spectrumBarHeight: barHeight,
      });
    }
  }, [barHeight, preset.options.channelLayout, preset.options.radial, preset.options.radius]);

  if (!isActive || !enabled) {
    return null;
  }

  const isRadial = preset.options.radial === true;

  return (
    <div
      className={styles.spectrumFrame}
      data-radial={isRadial ? 'true' : 'false'}
      style={{ opacity }}
    >
      <div
        ref={containerRef}
        className={styles.spectrum}
        data-testid="radio-visualizer-fullscreen"
        aria-hidden="true"
      />
    </div>
  );
}
