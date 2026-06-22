'use client';

import { useRadioPlayer } from '@lib/context/RadioPlayerContext';
import { useLayoutEffect, useRef } from 'react';
import styles from './VisualizerMode.module.css';

export interface RadioBarVisualizerFullscreenProps {
  isActive: boolean;
  enabled: boolean;
  opacity: number;
}

export function RadioBarVisualizerFullscreen({
  isActive,
  enabled,
  opacity,
}: RadioBarVisualizerFullscreenProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const { handle, isAvailable } = useRadioPlayer();

  useLayoutEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle) {
      return undefined;
    }

    const frame = frameRef.current;
    const host = hostRef.current;
    if (!frame || !host) {
      return undefined;
    }

    handle.mountBarCanvas(host);

    const syncSize = () => {
      if (frame.clientWidth < 48) {
        return;
      }

      handle.resizeBarCanvas();
    };

    syncSize();
    requestAnimationFrame(() => {
      syncSize();
      requestAnimationFrame(syncSize);
    });

    const observer = new ResizeObserver(syncSize);
    observer.observe(frame);
    window.addEventListener('resize', syncSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncSize);
    };
  }, [enabled, handle, isActive, isAvailable]);

  if (!isActive || !enabled) {
    return null;
  }

  return (
    <div
      ref={frameRef}
      className={styles.barFrame}
      data-irp-bar-fullscreen="true"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div
        ref={hostRef}
        className={styles.barFullscreen}
        data-testid="radio-bar-visualizer-fullscreen"
      />
    </div>
  );
}
