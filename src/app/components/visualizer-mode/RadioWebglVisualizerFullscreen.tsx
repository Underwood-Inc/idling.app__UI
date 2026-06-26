'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import type { WebglVisualizerCapabilityState } from '@lib/hooks/useWebglVisualizerCapability';
import { getBarVisualizerTheme } from '@widgets/radio-player/barVisualizerThemes';
import { createWebglVisualizerEngine } from '@widgets/radio-player/webgl/createWebglVisualizerEngine';
import { resolveWebglVisualizerThemeUniforms } from '@widgets/radio-player/webgl/resolveWebglVisualizerThemeUniforms';
import { normalizeWebglVisualizerPresetId } from '@widgets/radio-player/webgl/webglVisualizerPresets';
import { normalizeNeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion';
import type { NeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion.types';
import { AmbientSkyHorizonScene } from '../ambient-background';
import { STARRY_HORIZON_Y } from '@widgets/radio-player/webgl/renderers/createStarryHorizonRenderer';
import { useEffect, useRef, useState } from 'react';
import styles from './VisualizerMode.module.css';

export interface RadioWebglVisualizerFullscreenProps {
  isActive: boolean;
  enabled: boolean;
  opacity: number;
  presetId: string;
  constellationMotion: NeonConstellationMotionMode;
  capability: WebglVisualizerCapabilityState;
}

export function RadioWebglVisualizerFullscreen({
  isActive,
  enabled,
  opacity,
  presetId,
  constellationMotion,
  capability,
}: RadioWebglVisualizerFullscreenProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createWebglVisualizerEngine> | null>(null);
  const { handle, isAvailable } = useRadioPlayer();
  const normalizedPresetId = normalizeWebglVisualizerPresetId(presetId);
  const showStarryHorizonStars = normalizedPresetId === 'starry-horizon';
  const normalizedConstellationMotion = normalizeNeonConstellationMotionMode(constellationMotion);
  const [engineError, setEngineError] = useState<string | null>(null);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (showStarryHorizonStars && isActive && enabled) {
      document.documentElement.dataset.starryHorizonVisualizer = 'true';
    } else {
      delete document.documentElement.dataset.starryHorizonVisualizer;
    }

    return () => {
      delete document.documentElement.dataset.starryHorizonVisualizer;
    };
  }, [enabled, isActive, showStarryHorizonStars]);

  useEffect(() => {
    engineRef.current?.setBarOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    engineRef.current?.setPreset(normalizedPresetId);
  }, [normalizedPresetId]);

  useEffect(() => {
    engineRef.current?.setConstellationMotion(normalizedConstellationMotion);
  }, [normalizedConstellationMotion]);

  const releaseEngine = () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    canvasRef.current?.remove();
    canvasRef.current = null;
  };

  useEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle || !capability.isSupported) {
      releaseEngine();
      return undefined;
    }

    const frame = frameRef.current;
    const host = hostRef.current;
    if (!frame || !host) {
      return undefined;
    }

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvasRef.current = canvas;
      host.appendChild(canvas);
    }

    let engine = engineRef.current;
    if (!engine) {
      try {
        engine = createWebglVisualizerEngine(canvas, {
          theme: resolveWebglVisualizerThemeUniforms(getBarVisualizerTheme()),
          reducedMotion,
          initialPresetId: normalizedPresetId,
          constellationMotion: normalizedConstellationMotion,
          initialBarOpacity: opacity,
          onFatalError: (message) => {
            setEngineError(message);
          },
        });
        engineRef.current = engine;
        setEngineError(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'WebGL2 visualizers could not start on this device.';
        setEngineError(message);
        return undefined;
      }
    }

    let cancelled = false;

    const syncSize = () => {
      if (frame.clientWidth < 48 || frame.clientHeight < 48) {
        return;
      }

      engine?.resize(frame.clientWidth, frame.clientHeight);
    };

    const startEngine = async () => {
      await handle.play();
      if (cancelled) {
        return;
      }

      const analyser = handle.getAnalyser();
      if (!analyser) {
        setEngineError('Audio analyser is not ready yet. Start playback and try again.');
        return;
      }

      syncSize();
      engine?.start(analyser);
    };

    void startEngine();

    const observer = new ResizeObserver(syncSize);
    observer.observe(frame);
    window.addEventListener('resize', syncSize);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener('resize', syncSize);
      releaseEngine();
    };
  }, [
    capability.isSupported,
    enabled,
    handle,
    isActive,
    isAvailable,
    reducedMotion,
  ]);

  if (!isActive || !enabled) {
    return null;
  }

  if (engineError) {
    return (
      <div
        ref={frameRef}
        className={styles.webglFrame}
        data-irp-webgl-fullscreen="true"
      >
        <p
          className={styles.overlay__emptyState}
          data-testid="radio-webgl-visualizer-error"
          role="alert"
        >
          {engineError}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={styles.webglFrame}
      data-irp-webgl-fullscreen="true"
      data-starry-horizon={showStarryHorizonStars ? 'true' : 'false'}
      aria-hidden="true"
    >
      {showStarryHorizonStars ? (
        <AmbientSkyHorizonScene horizonRatio={STARRY_HORIZON_Y}>
          <div
            ref={hostRef}
            className={styles.webglFullscreen}
            data-testid="radio-webgl-visualizer-fullscreen"
          />
        </AmbientSkyHorizonScene>
      ) : (
        <div
          ref={hostRef}
          className={styles.webglFullscreen}
          data-testid="radio-webgl-visualizer-fullscreen"
        />
      )}
    </div>
  );
}
