'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './InteractiveTooltip.css';

interface InteractiveTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  isInsideParagraph?: boolean;
  disabled?: boolean;
  delay?: number; // Delay before showing tooltip in milliseconds
  className?: string; // Additional CSS class for tooltip wrapper
  triggerOnClick?: boolean; // If true, tooltip shows/hides on click instead of hover
  triggerOnRightClick?: boolean; // If true, tooltip shows on right-click (context menu style)
  onClose?: () => void; // Callback when tooltip closes
  onShow?: () => void; // Callback when tooltip is about to show
  show?: boolean; // If provided, controls tooltip visibility programmatically
}

// Utility function to detect mobile devices
const isMobileDevice = () => {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
};

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  content,
  children,
  isInsideParagraph = false,
  disabled = false,
  delay = 300,
  className = '',
  triggerOnClick = false,
  triggerOnRightClick = false,
  onClose,
  onShow,
  show
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0 }); // Fixed anchor point
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);

  // Store latest callbacks in refs to avoid dependency issues
  const onShowRef = useRef(onShow);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onShowRef.current = onShow;
    onCloseRef.current = onClose;
  });

  // Sync external show prop with internal state
  useEffect(() => {
    if (show !== undefined) {
      setShowTooltip(show);
      if (show && onShowRef.current) {
        onShowRef.current();
      } else if (!show && onCloseRef.current) {
        onCloseRef.current();
      }
    }
  }, [show]);

  // Function to close tooltip programmatically
  const closeTooltip = () => {
    if (show === undefined) {
      // Only control internal state if not controlled by show prop
      setShowTooltip(false);
    }
    if (onCloseRef.current) {
      onCloseRef.current();
    }
  };

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!tooltipContentRef.current) return;

    // Reset positioning to get accurate measurements
    tooltipContentRef.current.style.visibility = 'hidden';
    tooltipContentRef.current.style.position = 'fixed';
    tooltipContentRef.current.style.top = '0px';
    tooltipContentRef.current.style.left = '0px';
    tooltipContentRef.current.style.transform = 'none';
    tooltipContentRef.current.style.maxHeight = 'none';
    tooltipContentRef.current.style.maxWidth = 'none';

    // Force reflow and get dimensions
    tooltipContentRef.current.offsetHeight;
    const tooltipRect = tooltipContentRef.current.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Enhanced padding calculations
    const basePadding = 12;
    const minPadding = 8;
    const cursorOffset = 10; // Offset from cursor to avoid blocking

    // Use fixed anchor position (set when tooltip is first shown)
    const anchorX = anchorPosition.x;
    const anchorY = anchorPosition.y;

    // Calculate available space from anchor position
    const spaceAbove = anchorY;
    const spaceBelow = viewportHeight - anchorY;
    const spaceLeft = anchorX;
    const spaceRight = viewportWidth - anchorX;

    // Determine vertical position with viewport boundary checking
    let top: number;
    let maxHeight: number | undefined;

    // Calculate ideal positions
    const belowPosition = anchorY + cursorOffset;
    const abovePosition = anchorY - tooltipRect.height - cursorOffset;

    // Check if tooltip fits below anchor without being cut off
    if (belowPosition + tooltipRect.height <= viewportHeight - minPadding) {
      top = belowPosition;
    }
    // Check if tooltip fits above anchor without being cut off
    else if (abovePosition >= minPadding) {
      top = abovePosition;
    }
    // Position in larger space with scrolling if needed, ensuring viewport visibility
    else if (spaceBelow > spaceAbove) {
      top = Math.max(minPadding, belowPosition);
      const availableHeight = viewportHeight - top - minPadding;
      if (tooltipRect.height > availableHeight) {
        maxHeight = availableHeight;
      }
    } else {
      const availableHeight = anchorY - cursorOffset - minPadding;
      if (tooltipRect.height > availableHeight) {
        maxHeight = availableHeight;
        top = minPadding;
      } else {
        top = Math.max(minPadding, abovePosition);
      }
    }

    // Final viewport boundary check for vertical position
    if (top + (maxHeight || tooltipRect.height) > viewportHeight - minPadding) {
      top = viewportHeight - (maxHeight || tooltipRect.height) - minPadding;
      top = Math.max(minPadding, top);
    }

    // Determine horizontal position with viewport boundary checking
    let left: number;
    let maxWidth: number | undefined;

    // Calculate ideal positions
    const rightPosition = anchorX + cursorOffset;
    const leftPosition = anchorX - tooltipRect.width - cursorOffset;
    const centerPosition = anchorX - tooltipRect.width / 2;

    // Check if tooltip fits to the right without being cut off
    if (rightPosition + tooltipRect.width <= viewportWidth - minPadding) {
      left = rightPosition;
    }
    // Check if tooltip fits to the left without being cut off
    else if (leftPosition >= minPadding) {
      left = leftPosition;
    }
    // Check if centered position fits without being cut off
    else if (
      centerPosition >= minPadding &&
      centerPosition + tooltipRect.width <= viewportWidth - minPadding
    ) {
      left = centerPosition;
    }
    // Force fit within viewport with width constraints if necessary
    else {
      // Try to center as much as possible while staying in viewport
      left = Math.max(
        minPadding,
        Math.min(centerPosition, viewportWidth - tooltipRect.width - minPadding)
      );

      // If tooltip is still too wide, constrain width and position at edge
      if (
        left < minPadding ||
        left + tooltipRect.width > viewportWidth - minPadding
      ) {
        const availableWidth = viewportWidth - minPadding * 2;
        if (tooltipRect.width > availableWidth) {
          maxWidth = availableWidth;
        }
        left = minPadding;
      }
    }

    // Final viewport boundary check for horizontal position
    if (left + (maxWidth || tooltipRect.width) > viewportWidth - minPadding) {
      left = viewportWidth - (maxWidth || tooltipRect.width) - minPadding;
      left = Math.max(minPadding, left);
    }

    // Apply constraints if needed
    if (maxHeight) {
      tooltipContentRef.current.style.maxHeight = `${maxHeight}px`;
      tooltipContentRef.current.style.overflowY = 'auto';
    }
    if (maxWidth) {
      tooltipContentRef.current.style.maxWidth = `${maxWidth}px`;
      tooltipContentRef.current.style.overflowX = 'hidden';
    }

    // Restore visibility and set final position
    tooltipContentRef.current.style.visibility = 'visible';
    setPosition({ top, left });
  };

  // Update position only when tooltip is first shown
  useEffect(() => {
    if (showTooltip) {
      updatePosition();
    }
  }, [showTooltip, anchorPosition]); // Only depend on showTooltip and anchorPosition, not cursor movement

  // Handle scroll to keep tooltip in sync with page
  useEffect(() => {
    if (showTooltip) {
      // Only handle resize, not scroll - let tooltip scroll naturally with page
      const handleResize = () => {
        updatePosition();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showTooltip]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTooltip &&
        tooltipContentRef.current &&
        !tooltipContentRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        closeTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const handleMouseEnter = (event: React.MouseEvent) => {
    // Don't handle mouse events if controlled by show prop
    if (show !== undefined) return;

    // Update cursor position from the trigger event
    setAnchorPosition({ x: event.clientX, y: event.clientY });

    // On mobile, don't trigger hover events
    const isMobile = isMobileDevice();
    if (disabled || triggerOnClick || isMobile) return;

    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      if (onShowRef.current) {
        onShowRef.current(); // Call onShow callback before showing tooltip
      }
      setShowTooltip(true);
    }, delay);
    hideTimeoutRef.current = timeout;
  };

  const handleMouseLeave = () => {
    // Don't handle mouse events if controlled by show prop
    if (show !== undefined) return;

    // On mobile, don't trigger mouse leave events
    const isMobile = isMobileDevice();
    if (triggerOnClick || isMobile) return;

    isHoveringRef.current = false;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowTooltip(false);
      }
    }, 300); // Longer delay for interactive content
    hideTimeoutRef.current = timeout;
  };

  const handleClick = (event: React.MouseEvent) => {
    // Don't handle click events if controlled by show prop
    if (show !== undefined) return;

    if (disabled) return;

    // Update cursor position from the click event
    setAnchorPosition({ x: event.clientX, y: event.clientY });

    // On mobile, always use click mode regardless of triggerOnClick setting
    const isMobile = isMobileDevice();

    if (!triggerOnClick && !triggerOnRightClick && !isMobile) return;

    const newShowState = !showTooltip;

    if (newShowState && onShow) {
      onShow(); // Call onShow callback before showing tooltip
    }

    setShowTooltip(newShowState);

    if (!newShowState && onClose) {
      onClose();
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    // Don't handle context menu if controlled by show prop or not enabled
    if (show !== undefined || !triggerOnRightClick || disabled) return;

    event.preventDefault();

    // Update cursor position from the context menu event
    setAnchorPosition({ x: event.clientX, y: event.clientY });

    if (onShow) {
      onShow(); // Call onShow callback before showing tooltip
    }

    setShowTooltip(true);
  };

  const handleTooltipMouseEnter = () => {
    if (triggerOnClick || isMobileDevice()) return; // Don't use hover logic in click mode or on mobile

    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (triggerOnClick || isMobileDevice()) return; // Don't use hover logic in click mode or on mobile

    isHoveringRef.current = false;
    handleMouseLeave();
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Clone content and pass closeTooltip function if it's a React element
  const enhancedContent = React.isValidElement(content)
    ? React.cloneElement(content as React.ReactElement<any>, {
        // Only pass closeTooltip to React components, not DOM elements
        ...(typeof (content as any).type === 'function' ? { closeTooltip } : {})
      })
    : content;

  const Wrapper = isInsideParagraph ? 'span' : 'div';

  return (
    <>
      <Wrapper
        ref={tooltipRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ display: 'inline-block' }}
      >
        {children}
      </Wrapper>
      {mounted &&
        (show !== undefined ? show : showTooltip) &&
        content &&
        createPortal(
          <div
            ref={tooltipContentRef}
            className={`link-tooltip interactive-tooltip glass-border-heavy ${className} ${showTooltip ? 'visible' : ''}`}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: className.includes('search-overlay-tooltip')
                ? 10100
                : 10001,
              // Protected background styles - components cannot override these
              background: 'var(--tooltip-glass-bg) !important',
              backdropFilter: 'var(--tooltip-glass-blur) !important',
              WebkitBackdropFilter: 'var(--tooltip-glass-blur) !important',
              border: '1px solid var(--tooltip-glass-border) !important',
              boxShadow: 'var(--tooltip-glass-shadow) !important',
              // Search overlay specific styles
              ...(className.includes('search-overlay-tooltip') && {
                maxHeight: '200px',
                overflowY: 'auto' as const,
                overflowX: 'hidden' as const
              }),
              // Only allow transparent background for author-tooltip-wrapper
              ...(className === 'author-tooltip-wrapper' && {
                background: 'transparent !important',
                backdropFilter: 'none !important',
                WebkitBackdropFilter: 'none !important',
                border: 'none !important',
                boxShadow: 'none !important'
              })
            }}
            data-testid="interactive-tooltip"
          >
            {enhancedContent}
          </div>,
          document.body
        )}
    </>
  );
};
