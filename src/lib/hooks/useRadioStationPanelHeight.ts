import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  clampRadioStationPanelHeight,
  loadRadioStationPanelHeight,
  RADIO_STATION_PANEL_HEIGHT_RANGE_PX,
  saveRadioStationPanelHeight,
} from '@widgets/radio-player/radioStationPanelHeightPreferences';

export interface UseRadioStationPanelHeightOptions {
  panelRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export interface UseRadioStationPanelHeightResult {
  panelHeightPx: number | null;
  isResizing: boolean;
  beginResize: (clientY: number) => void;
  resetHeight: () => void;
}

function measurePanelHeight(panelRef: RefObject<HTMLElement | null>): number {
  const measured = panelRef.current?.getBoundingClientRect().height;
  if (measured && measured > 0) {
    return measured;
  }

  return RADIO_STATION_PANEL_HEIGHT_RANGE_PX.min;
}

export function useRadioStationPanelHeight({
  panelRef,
  enabled = true,
}: UseRadioStationPanelHeightOptions): UseRadioStationPanelHeightResult {
  const [panelHeightPx, setPanelHeightPx] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stored = loadRadioStationPanelHeight();
    setPanelHeightPx(stored);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || panelHeightPx === null) {
      return undefined;
    }

    const clamped = clampRadioStationPanelHeight(panelHeightPx);
    if (clamped !== panelHeightPx) {
      setPanelHeightPx(clamped);
      saveRadioStationPanelHeight(clamped);
    }

    return undefined;
  }, [enabled, panelHeightPx]);

  useEffect(() => {
    if (!enabled || panelHeightPx === null) {
      return undefined;
    }

    const onResize = () => {
      setPanelHeightPx((current) => {
        if (current === null) {
          return current;
        }

        const clamped = clampRadioStationPanelHeight(current);
        if (clamped !== current) {
          saveRadioStationPanelHeight(clamped);
        }

        return clamped;
      });
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [enabled, panelHeightPx]);

  const beginResize = useCallback(
    (clientY: number) => {
      const startY = clientY;
      const startHeight = panelHeightPx ?? measurePanelHeight(panelRef);

      setIsResizing(true);
      setPanelHeightPx(clampRadioStationPanelHeight(startHeight));

      const onPointerMove = (event: PointerEvent) => {
        const delta = startY - event.clientY;
        const nextHeight = clampRadioStationPanelHeight(startHeight + delta);
        setPanelHeightPx(nextHeight);
      };

      const onPointerUp = () => {
        setIsResizing(false);
        setPanelHeightPx((current) => {
          if (current !== null) {
            saveRadioStationPanelHeight(current);
          }
          return current;
        });
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [panelHeightPx, panelRef]
  );

  const resetHeight = useCallback(() => {
    setPanelHeightPx(null);
    saveRadioStationPanelHeight(null);
  }, []);

  return {
    panelHeightPx,
    isResizing,
    beginResize,
    resetHeight,
  };
}
