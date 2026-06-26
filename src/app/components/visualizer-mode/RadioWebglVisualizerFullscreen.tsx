'use client';

import { AmbientSkyHorizonLayer } from '../ambient-background';
import { STARRY_HORIZON_Y } from '@widgets/radio-player/webgl/renderers/createStarryHorizonRenderer';
import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import type { WebglVisualizerCapabilityState } from '@lib/hooks/useWebglVisualizerCapability';
import { getBarVisualizerTheme } from '@widgets/radio-player/barVisualizerThemes';
import { scheduleVisualizerLayoutSync } from '@widgets/radio-player/visualizerLayoutSync';
import { waitForRadioAnalyser } from '@widgets/radio-player/waitForRadioAnalyser';
import { createWebglVisualizerEngine } from '@widgets/radio-player/webgl/createWebglVisualizerEngine';
import { normalizeNeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion';
import type { NeonConstellationMotionMode } from '@widgets/radio-player/webgl/neonConstellationMotion.types';
import { resolveWebglVisualizerThemeUniforms } from '@widgets/radio-player/webgl/resolveWebglVisualizerThemeUniforms';
import { normalizeWebglVisualizerPresetId } from '@widgets/radio-player/webgl/webglVisualizerPresets';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hostElement, setHostElement] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createWebglVisualizerEngine> | null>(null);
  const { handle, isAvailable } = useRadioPlayer();
  const normalizedPresetId = normalizeWebglVisualizerPresetId(presetId);
  const showStarryHorizonStars = normalizedPresetId === 'starry-horizon';
  const normalizedConstellationMotion = normalizeNeonConstellationMotionMode(constellationMotion);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const webglReady =
    capability.isResolved === false || capability.isSupported === true;

  const bindHostRef = useCallback((node: HTMLDivElement | null) => {
    hostRef.current = node;
    setHostElement(node);
  }, []);

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

  useLayoutEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle || !webglReady) {
      releaseEngine();
      return undefined;
    }

    const frame = frameRef.current;
    const host = hostElement;
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
        });
        engineRef.current = engine;
      } catch {
        releaseEngine();
        return undefined;
      }
    }

    let cancelled = false;
    let cancelLayoutSync: (() => void) | null = null;

    const syncSize = (width = frame.clientWidth, height = frame.clientHeight) => {
      if (width < 48 || height < 48) {
        return;
      }

      engine?.resize(width, height);
    };

    const startEngine = async () => {
      let analyser: AnalyserNode | null = null;

      while (!analyser && !cancelled) {
        analyser = await waitForRadioAnalyser({ handle, maxAttempts: 8, intervalMs: 125 });
        if (!analyser && !cancelled) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 500);
          });
        }
      }

      if (cancelled || !analyser) {
        return;
      }

      cancelLayoutSync = scheduleVisualizerLayoutSync({
        frame,
        onSize: (width, height) => {
          syncSize(width, height);
        },
      });
      syncSize();
      engine?.start(analyser);
    };

    const onWindowResize = () => {
      syncSize();
    };

    void startEngine();

    const observer = new ResizeObserver(() => {
      syncSize();
    });
    observer.observe(frame);
    window.addEventListener('resize', onWindowResize);

    return () => {
      cancelled = true;
      cancelLayoutSync?.();
      observer.disconnect();
      window.removeEventListener('resize', onWindowResize);
      releaseEngine();
    };
  }, [
    enabled,
    handle,
    hostElement,
    isActive,
    isAvailable,
    normalizedConstellationMotion,
    normalizedPresetId,
    opacity,
    reducedMotion,
    showStarryHorizonStars,
    webglReady,
  ]);

  if (!isActive || !enabled) {
    return null;
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
        <AmbientSkyHorizonLayer horizonRatio={STARRY_HORIZON_Y} variant="sky" />
      ) : null}
      <div
        ref={bindHostRef}
        className={styles.webglFullscreen}
        data-testid="radio-webgl-visualizer-fullscreen"
      />
      {showStarryHorizonStars ? (
        <AmbientSkyHorizonLayer horizonRatio={STARRY_HORIZON_Y} variant="reflection" />
      ) : null}
    </div>
  );
}
