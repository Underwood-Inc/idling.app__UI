import { useCallback, useEffect, useState } from 'react';
import {
  clampRadioDockWidth,
  loadRadioDockWidth,
  resolveRadioDockWidthMax,
  saveRadioDockWidth,
} from '@widgets/radio-player/radioDockWidthPreferences';

export interface UseRadioDockWidthResult {
  dockWidthPx: number | null;
  isResizing: boolean;
  beginResize: (clientX: number) => void;
  resetWidth: () => void;
}

export function useRadioDockWidth(): UseRadioDockWidthResult {
  const [dockWidthPx, setDockWidthPx] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setDockWidthPx(loadRadioDockWidth());
  }, []);

  const beginResize = useCallback(
    (clientX: number) => {
      const startX = clientX;
      const startWidth =
        dockWidthPx ??
        clampRadioDockWidth(
          document.querySelector<HTMLElement>('[data-testid="radio-player-bar"]')?.getBoundingClientRect()
            .width ?? resolveRadioDockWidthMax(window.innerWidth)
        );

      setIsResizing(true);

      const onPointerMove = (event: PointerEvent) => {
        const delta = event.clientX - startX;
        const nextWidth = clampRadioDockWidth(
          Math.min(resolveRadioDockWidthMax(window.innerWidth), startWidth + delta)
        );
        setDockWidthPx(nextWidth);
      };

      const onPointerUp = () => {
        setIsResizing(false);
        setDockWidthPx((current) => {
          saveRadioDockWidth(current);
          return current;
        });
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [dockWidthPx]
  );

  const resetWidth = useCallback(() => {
    setDockWidthPx(null);
    saveRadioDockWidth(null);
  }, []);

  return {
    dockWidthPx,
    isResizing,
    beginResize,
    resetWidth,
  };
}
