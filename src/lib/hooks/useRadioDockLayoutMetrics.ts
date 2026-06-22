import type { RefObject } from 'react';
import { useEffect } from 'react';

export interface UseRadioDockLayoutMetricsOptions {
  playerRef: RefObject<HTMLElement | null>;
  rowRef: RefObject<HTMLElement | null>;
  expanded?: boolean;
}

/**
 * Publishes live dock geometry for fullscreen visualizer alignment and page padding.
 */
export function useRadioDockLayoutMetrics({
  playerRef,
  rowRef,
  expanded = false,
}: UseRadioDockLayoutMetricsOptions): void {
  useEffect(() => {
    const player = playerRef.current;
    const row = rowRef.current;
    if (!player || !row) {
      return undefined;
    }

    const syncHeight = () => {
      const playerRect = player.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const playerHeightPx = Math.ceil(playerRect.height);
      const rowHeightPx = Math.ceil(rowRect.height);
      const rowTopPx = Math.ceil(rowRect.top);

      document.documentElement.style.setProperty('--irp-bar-height', `${playerHeightPx + 36}px`);
      document.documentElement.style.setProperty('--irp-dock-height', `${rowHeightPx}px`);
      document.documentElement.style.setProperty('--irp-dock-top', `${rowTopPx}px`);
      document.documentElement.style.setProperty('--irp-dock-bottom-gap', '0.75rem');
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(player);
    observer.observe(row);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--irp-bar-height');
      document.documentElement.style.removeProperty('--irp-dock-height');
      document.documentElement.style.removeProperty('--irp-dock-top');
      document.documentElement.style.removeProperty('--irp-dock-bottom-gap');
    };
  }, [expanded, playerRef, rowRef]);
}
