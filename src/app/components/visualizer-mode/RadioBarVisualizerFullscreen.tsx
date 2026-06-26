'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { resolveRadioFullscreenVisualHeightRatio } from '@widgets/radio-player/radioFullscreenVisualizerDisplay';
import { waitForRadioAnalyser } from '@widgets/radio-player/waitForRadioAnalyser';
import { scheduleVisualizerLayoutSync } from '@widgets/radio-player/visualizerLayoutSync';
import { getBarVisualizerFullscreenLayout } from '@widgets/radio-player/barVisualizerPresets';
import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import styles from './VisualizerMode.module.css';

export interface RadioBarVisualizerFullscreenProps {
  isActive: boolean;
  enabled: boolean;
  opacity: number;
  barHeight: number;
}

export function RadioBarVisualizerFullscreen({
  isActive,
  enabled,
  opacity,
  barHeight,
}: RadioBarVisualizerFullscreenProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const { handle, isAvailable } = useRadioPlayer();
  const visualHeightRatio = resolveRadioFullscreenVisualHeightRatio(barHeight);
  const [barPresetId, setBarPresetId] = useState('wave');
  const fullscreenLayout = getBarVisualizerFullscreenLayout(barPresetId);

  useEffect(() => {
    if (!isActive || !enabled || !handle) {
      return undefined;
    }

    const syncPreset = () => {
      setBarPresetId(handle.getVisualizerPreferences().presetId);
    };

    syncPreset();
    const timer = window.setInterval(syncPreset, 300);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, handle, isActive]);

  useLayoutEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle) {
      return undefined;
    }

    const frame = frameRef.current;
    const host = hostRef.current;
    if (!frame || !host) {
      return undefined;
    }

    let cancelled = false;
    let cancelLayoutSync: (() => void) | null = null;

    const syncSize = () => {
      if (frame.clientWidth < 48 || frame.clientHeight < 48) {
        return;
      }

      handle.resizeBarCanvas();
    };

    const mount = async () => {
      let analyser: AnalyserNode | null = null;

      while (!analyser && !cancelled) {
        analyser = await waitForRadioAnalyser({ handle, maxAttempts: 8, intervalMs: 125 });
        if (!analyser && !cancelled) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 500);
          });
        }
      }

      if (cancelled || !host.isConnected) {
        return;
      }

      handle.mountBarCanvas(host);
      cancelLayoutSync = scheduleVisualizerLayoutSync({
        frame,
        onSize: () => {
          syncSize();
        },
      });
      syncSize();
    };

    void mount();

    const observer = new ResizeObserver(syncSize);
    observer.observe(frame);
    observer.observe(host);
    window.addEventListener('resize', syncSize);

    return () => {
      cancelled = true;
      cancelLayoutSync?.();
      observer.disconnect();
      window.removeEventListener('resize', syncSize);
      handle.unmountBarCanvas();
    };
  }, [barPresetId, enabled, handle, isActive, isAvailable]);

  useLayoutEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle) {
      return undefined;
    }

    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }

    const syncSize = () => {
      if (frame.clientWidth < 48 || frame.clientHeight < 48) {
        return;
      }

      handle.resizeBarCanvas();
    };

    syncSize();
    requestAnimationFrame(syncSize);

    return undefined;
  }, [barHeight, barPresetId, enabled, handle, isActive, isAvailable]);

  if (!isActive || !enabled) {
    return null;
  }

  return (
    <div
      ref={frameRef}
      className={styles.barFrame}
      data-irp-bar-fullscreen="true"
      data-layout={fullscreenLayout}
      data-radial={fullscreenLayout === 'radial' ? 'true' : 'false'}
      style={{ opacity }}
      aria-hidden="true"
    >
      <div
        ref={hostRef}
        className={styles.barFullscreen}
        data-testid="radio-bar-visualizer-fullscreen"
        style={{
          ['--irp-fullscreen-viz-height-ratio' as string]: String(visualHeightRatio),
        }}
      />
    </div>
  );
}
