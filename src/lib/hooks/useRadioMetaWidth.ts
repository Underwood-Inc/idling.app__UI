import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  clampRadioMetaWidth,
  loadRadioMetaWidth,
  RADIO_META_WIDTH_RANGE_PX,
  saveRadioMetaWidth,
} from '@widgets/radio-player/radioMetaWidthPreferences';

export interface UseRadioMetaWidthOptions {
  metaBlockRef: RefObject<HTMLElement | null>;
  rowRef: RefObject<HTMLElement | null>;
  isFullscreen?: boolean;
}

export interface UseRadioMetaWidthResult {
  metaWidthPx: number | null;
  isResizing: boolean;
  beginResize: (clientX: number) => void;
  resetWidth: () => void;
}

function measureRowWidth(rowRef: RefObject<HTMLElement | null>): number {
  return rowRef.current?.getBoundingClientRect().width ?? window.innerWidth;
}

export function useRadioMetaWidth({
  metaBlockRef,
  rowRef,
  isFullscreen = false,
}: UseRadioMetaWidthOptions): UseRadioMetaWidthResult {
  const [metaWidthPx, setMetaWidthPx] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const stored = loadRadioMetaWidth();
    if (stored === null) {
      setMetaWidthPx(null);
      return;
    }

    setMetaWidthPx(
      clampRadioMetaWidth({
        widthPx: stored,
        rowWidthPx: measureRowWidth(rowRef),
        isFullscreen,
      })
    );
  }, [isFullscreen, rowRef]);

  useEffect(() => {
    if (metaWidthPx === null) {
      return;
    }

    const clamped = clampRadioMetaWidth({
      widthPx: metaWidthPx,
      rowWidthPx: measureRowWidth(rowRef),
      isFullscreen,
    });
    if (clamped !== metaWidthPx) {
      setMetaWidthPx(clamped);
      saveRadioMetaWidth(clamped);
    }
  }, [isFullscreen, metaWidthPx, rowRef]);

  const beginResize = useCallback(
    (clientX: number) => {
      const startX = clientX;
      const rowWidth = measureRowWidth(rowRef);
      const measuredWidth = metaBlockRef.current?.getBoundingClientRect().width;
      const startWidth =
        metaWidthPx ??
        (measuredWidth && measuredWidth > 0
          ? measuredWidth
          : RADIO_META_WIDTH_RANGE_PX.min);

      setIsResizing(true);
      setMetaWidthPx(
        clampRadioMetaWidth({
          widthPx: startWidth,
          rowWidthPx: rowWidth,
          isFullscreen,
        })
      );

      const onPointerMove = (event: PointerEvent) => {
        const delta = event.clientX - startX;
        const nextWidth = clampRadioMetaWidth({
          widthPx: startWidth + delta,
          rowWidthPx: measureRowWidth(rowRef),
          isFullscreen,
        });
        setMetaWidthPx(nextWidth);
      };

      const onPointerUp = () => {
        setIsResizing(false);
        setMetaWidthPx((current) => {
          if (current !== null) {
            saveRadioMetaWidth(current);
          }
          return current;
        });
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [isFullscreen, metaBlockRef, metaWidthPx, rowRef]
  );

  const resetWidth = useCallback(() => {
    setMetaWidthPx(null);
    saveRadioMetaWidth(null);
  }, []);

  return {
    metaWidthPx,
    isResizing,
    beginResize,
    resetWidth,
  };
}
