import type { RefObject } from 'react';
import { useEffect } from 'react';

export interface UseRadioDockLayoutMetricsOptions {
  playerRef: RefObject<HTMLElement | null>;
  expanded?: boolean;
}

/**
 * Publishes live dock geometry for fullscreen visualizer alignment and page padding.
 */
export function useRadioDockLayoutMetrics({
  playerRef,
  expanded = false,
}: UseRadioDockLayoutMetricsOptions): void {
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return undefined;
    }

    const syncHeight = () => {
      const rect = player.getBoundingClientRect();
      const heightPx = Math.ceil(rect.height);
      const dockTopPx = Math.ceil(rect.top);

      document.documentElement.style.setProperty('--irp-bar-height', `${heightPx + 36}px`);
      document.documentElement.style.setProperty('--irp-dock-height', `${heightPx}px`);
      document.documentElement.style.setProperty('--irp-dock-top', `${dockTopPx}px`);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(player);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--irp-bar-height');
      document.documentElement.style.removeProperty('--irp-dock-height');
      document.documentElement.style.removeProperty('--irp-dock-top');
    };
  }, [expanded, playerRef]);
}
