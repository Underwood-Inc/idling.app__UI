import { RefObject, useCallback, useState } from 'react';

export const useTooltipPosition = (
  tooltipRef: RefObject<HTMLElement>,
  tooltipContentRef: RefObject<HTMLElement>
) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!tooltipRef.current || !tooltipContentRef.current) return;

    const triggerRect = tooltipRef.current.getBoundingClientRect();
    const tooltipRect = tooltipContentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + 8;
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    // Adjust horizontal position if tooltip would go off-screen
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // Adjust vertical position if tooltip would go off-screen
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = triggerRect.top - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  }, [tooltipRef, tooltipContentRef]);

  return { position, updatePosition };
};
