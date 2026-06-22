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
  const containerRef = useRef<HTMLDivElement>(null);
  const { handle, isAvailable } = useRadioPlayer();

  useLayoutEffect(() => {
    if (!isActive || !enabled || !isAvailable || !handle) {
      return undefined;
    }

    const host = containerRef.current;
    if (!host) {
      return undefined;
    }

    handle.mountBarCanvas(host);

    const onResize = () => {
      handle.resizeBarCanvas();
    };

    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(host);
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [enabled, handle, isActive, isAvailable]);

  if (!isActive || !enabled) {
    return null;
  }

  return (
    <div
      className={styles.barFrame}
      data-irp-bar-fullscreen="true"
      style={{ opacity }}
      aria-hidden="true"
    >
      <div ref={containerRef} className={styles.barFullscreen} data-testid="radio-bar-visualizer-fullscreen" />
    </div>
  );
}
