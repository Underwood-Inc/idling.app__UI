import { useEffect, useState } from 'react';

/** Matches RadioPlayerBar.module.css — inline dock strip hidden at or below this width (backdrop mode is unaffected). */
export const RADIO_DOCK_INLINE_VIZ_MAX_WIDTH_PX = 860;

export function useRadioDockInlineVisualizer(): boolean {
  const [showInlineVisualizer, setShowInlineVisualizer] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${RADIO_DOCK_INLINE_VIZ_MAX_WIDTH_PX}px)`
    );

    const sync = () => {
      setShowInlineVisualizer(!mediaQuery.matches);
    };

    sync();
    mediaQuery.addEventListener('change', sync);

    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, []);

  return showInlineVisualizer;
}
