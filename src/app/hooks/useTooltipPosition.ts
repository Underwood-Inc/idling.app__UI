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

    const PADDING = 8;
    
    // Calculate preferred position (below the trigger)
    let top = triggerRect.bottom + PADDING;
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    // Check if there's enough space below the trigger
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const tooltipHeight = tooltipRect.height;

    // If not enough space below, but more space above, position above
    if (spaceBelow < tooltipHeight + PADDING && spaceAbove > spaceBelow) {
      top = triggerRect.top - tooltipHeight - PADDING;
    }

    // Adjust horizontal position if tooltip would go off-screen
    if (left < PADDING) {
      left = PADDING;
    } else if (left + tooltipRect.width > viewportWidth - PADDING) {
      left = viewportWidth - tooltipRect.width - PADDING;
    }

    // Final check: if tooltip would still go off-screen vertically, 
    // position it in the best available space
    if (top < PADDING) {
      top = PADDING;
    } else if (top + tooltipHeight > viewportHeight - PADDING) {
      // If there's more space above than below, position above
      if (spaceAbove > spaceBelow) {
        top = Math.max(PADDING, triggerRect.top - tooltipHeight - PADDING);
      } else {
        // Otherwise, position at the bottom of available space
        top = viewportHeight - tooltipHeight - PADDING;
      }
    }

    setPosition({ top, left });
  }, [tooltipRef, tooltipContentRef]);

  return { position, updatePosition };
};
