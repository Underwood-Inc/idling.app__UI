'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import type AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useCallback, useEffect, useRef } from 'react';
import type { RadioVisualizerPreset } from '@widgets/radio-player/radioVisualizerPresets';
import { RADIO_VISUALIZER_BASE_OPTIONS } from '@widgets/radio-player/radioVisualizerPresets';
import {
  resolveRadioFullscreenLinearBoost,
  resolveRadioFullscreenRadialRadius,
  resolveRadioFullscreenVisualHeightRatio,
} from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import {
  createRadioSpectrumPeakAutoGainState,
  resolveRadioSpectrumPeakSensitivity,
  tickRadioSpectrumPeakAutoGain,
} from '@widgets/radio-player/radioSpectrumPeakAutoGain';
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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const barHeightRef = useRef(barHeight);
  const peakStateRef = useRef(createRadioSpectrumPeakAutoGainState());
  const peakRafRef = useRef(0);
  const { handle, isAvailable } = useRadioPlayer();
  const isRadial = preset.options.radial === true;

  barHeightRef.current = barHeight;

  const applyBarHeightSettings = useCallback(
    (instance: AudioMotionAnalyzer, nextBarHeight: number, rollingPeak: number) => {
      const baseLinearBoost = RADIO_VISUALIZER_BASE_OPTIONS.linearBoost ?? 1.45;
      const baseMinDecibels = RADIO_VISUALIZER_BASE_OPTIONS.minDecibels ?? -88;
      const baseMaxDecibels = RADIO_VISUALIZER_BASE_OPTIONS.maxDecibels ?? -22;
      const sensitivity = resolveRadioSpectrumPeakSensitivity({
        spectrumBarHeight: nextBarHeight,
        rollingPeak,
        baseMinDecibels,
        baseMaxDecibels,
      });

      instance.setSensitivity(sensitivity.minDecibels, sensitivity.maxDecibels);
      instance.linearBoost = resolveRadioFullscreenLinearBoost(baseLinearBoost, nextBarHeight);

      if (isRadial) {
        instance.radius = resolveRadioFullscreenRadialRadius({
          presetRadius: preset.options.radius,
          channelLayout: preset.options.channelLayout,
          spectrumBarHeight: nextBarHeight,
        });
      }
    },
    [isRadial, preset.options.channelLayout, preset.options.radius]
  );

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

      analyserRef.current = analyser;
      peakStateRef.current = createRadioSpectrumPeakAutoGainState();

      const initialSensitivity = resolveRadioSpectrumPeakSensitivity({
        spectrumBarHeight: barHeightRef.current,
        rollingPeak: peakStateRef.current.rollingPeak,
        baseMinDecibels: RADIO_VISUALIZER_BASE_OPTIONS.minDecibels ?? -88,
        baseMaxDecibels: RADIO_VISUALIZER_BASE_OPTIONS.maxDecibels ?? -22,
      });

      analyser.minDecibels = initialSensitivity.minDecibels;
      analyser.maxDecibels = initialSensitivity.maxDecibels;

      const AudioMotion = (await import('audiomotion-analyzer')).default;
      if (cancelled) {
        return;
      }

      const baseLinearBoost = RADIO_VISUALIZER_BASE_OPTIONS.linearBoost ?? 1.45;
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
        minDecibels: initialSensitivity.minDecibels,
        maxDecibels: initialSensitivity.maxDecibels,
        source: analyser,
        audioCtx,
        connectSpeakers: false,
      });

      if (cancelled) {
        instance.destroy();
        return;
      }

      analyzerRef.current = instance;
      applyBarHeightSettings(instance, barHeightRef.current, peakStateRef.current.rollingPeak);
      syncAnalyzerCanvasSize(container, instance);

      resizeObserver = new ResizeObserver(() => {
        syncAnalyzerCanvasSize(container, instance);
      });
      resizeObserver.observe(container);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let frameCounter = 0;

      const tickPeakNormalization = () => {
        if (cancelled || !analyzerRef.current || !analyserRef.current) {
          return;
        }

        analyserRef.current.getByteFrequencyData(buffer);
        const tick = tickRadioSpectrumPeakAutoGain({
          frequencyData: buffer,
          state: peakStateRef.current,
        });
        peakStateRef.current = tick.state;

        frameCounter += 1;
        if (frameCounter % 6 === 0) {
          applyBarHeightSettings(
            analyzerRef.current,
            barHeightRef.current,
            peakStateRef.current.rollingPeak
          );
        }

        peakRafRef.current = requestAnimationFrame(tickPeakNormalization);
      };

      peakRafRef.current = requestAnimationFrame(tickPeakNormalization);
    })();

    return () => {
      cancelled = true;
      if (peakRafRef.current) {
        cancelAnimationFrame(peakRafRef.current);
        peakRafRef.current = 0;
      }
      resizeObserver?.disconnect();
      analyzerRef.current?.destroy();
      analyzerRef.current = null;
      analyserRef.current = null;
    };
  }, [applyBarHeightSettings, enabled, handle, isActive, isAvailable, isRadial, preset]);

  useEffect(() => {
    const instance = analyzerRef.current;
    if (!instance) {
      return;
    }

    applyBarHeightSettings(instance, barHeight, peakStateRef.current.rollingPeak);
  }, [applyBarHeightSettings, barHeight]);

  if (!isActive || !enabled) {
    return null;
  }

  const visualHeightRatio = resolveRadioFullscreenVisualHeightRatio(barHeight);

  return (
    <div
      className={styles.spectrumFrame}
      data-irp-fullscreen-viz-frame="true"
      data-radial={isRadial ? 'true' : 'false'}
      style={{ opacity }}
    >
      <div
        ref={containerRef}
        className={styles.spectrum}
        data-testid="radio-visualizer-fullscreen"
        style={{
          ['--irp-fullscreen-viz-height-ratio' as string]: String(visualHeightRatio),
        }}
        aria-hidden="true"
      />
    </div>
  );
}
