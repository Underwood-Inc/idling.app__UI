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
  onClose?: () => void; // Callback when tooltip closes
  onShow?: () => void; // Callback when tooltip is about to show
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
  onClose,
  onShow
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  // Function to close tooltip programmatically
  const closeTooltip = () => {
    setShowTooltip(false);
    if (onClose) {
      onClose();
    }
  };

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!tooltipRef.current || !tooltipContentRef.current) return;

    const triggerRect = tooltipRef.current.getBoundingClientRect();

    // Force a reflow to ensure we get the latest dimensions
    tooltipContentRef.current.style.visibility = 'hidden';
    tooltipContentRef.current.style.position = 'fixed';
    tooltipContentRef.current.style.top = '0px';
    tooltipContentRef.current.style.left = '0px';

    // Get the actual current dimensions after potential content changes
    const tooltipRect = tooltipContentRef.current.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Calculate available space with padding
    const padding = 12;
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewportWidth - triggerRect.right;

    // Determine vertical position with better logic
    let top: number;
    const preferBelow = spaceBelow >= tooltipRect.height + padding;
    const preferAbove = spaceAbove >= tooltipRect.height + padding;

    if (preferBelow) {
      // Position below with padding
      top = triggerRect.bottom + padding;
    } else if (preferAbove) {
      // Position above with padding
      top = triggerRect.top - tooltipRect.height - padding;
    } else {
      // Not enough space in either direction, position where there's more space
      if (spaceBelow >= spaceAbove) {
        top = triggerRect.bottom + 4;
      } else {
        top = triggerRect.top - tooltipRect.height - 4;
      }
    }

    // Ensure tooltip stays within viewport vertically with minimum padding
    const minPadding = 8;
    top = Math.max(
      minPadding,
      Math.min(top, viewportHeight - tooltipRect.height - minPadding)
    );

    // Determine horizontal position with better centering
    let left: number;
    const idealCenterLeft =
      triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;

    if (
      idealCenterLeft >= minPadding &&
      idealCenterLeft + tooltipRect.width <= viewportWidth - minPadding
    ) {
      // Center if it fits
      left = idealCenterLeft;
    } else if (
      triggerRect.left + tooltipRect.width <=
      viewportWidth - minPadding
    ) {
      // Align to left edge of trigger if it fits
      left = triggerRect.left;
    } else if (triggerRect.right - tooltipRect.width >= minPadding) {
      // Align to right edge of trigger if it fits
      left = triggerRect.right - tooltipRect.width;
    } else {
      // Force fit within viewport
      left = Math.max(
        minPadding,
        Math.min(
          idealCenterLeft,
          viewportWidth - tooltipRect.width - minPadding
        )
      );
    }

    // Restore visibility and set final position
    tooltipContentRef.current.style.visibility = 'visible';
    setPosition({ top, left });
  };

  useEffect(() => {
    if (showTooltip && tooltipContentRef.current) {
      // Initial position update
      updatePosition();

      // Add event listeners for external changes
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      // Set up ResizeObserver to watch for content size changes
      if ('ResizeObserver' in window && tooltipContentRef.current) {
        resizeObserverRef.current = new ResizeObserver((entries) => {
          // Debounce position updates to avoid excessive calls
          setTimeout(updatePosition, 10);
        });
        resizeObserverRef.current.observe(tooltipContentRef.current);
      }

      // Set up MutationObserver to watch for content changes (like images loading)
      if (tooltipContentRef.current) {
        mutationObserverRef.current = new MutationObserver((mutations) => {
          let shouldUpdate = false;
          mutations.forEach((mutation) => {
            // Check for added/removed nodes or attribute changes that might affect size
            if (
              mutation.type === 'childList' ||
              (mutation.type === 'attributes' &&
                ['style', 'class', 'width', 'height'].includes(
                  mutation.attributeName || ''
                ))
            ) {
              shouldUpdate = true;
            }
          });

          if (shouldUpdate) {
            // Delay to allow for layout changes to complete
            setTimeout(updatePosition, 50);
          }
        });

        mutationObserverRef.current.observe(tooltipContentRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class', 'width', 'height', 'src']
        });
      }

      // Additional position updates for dynamic content
      const intervals = [100, 250, 500, 1000]; // Check at these intervals
      const timeouts = intervals.map((delay) =>
        setTimeout(updatePosition, delay)
      );

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);

        // Clean up observers
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }

        if (mutationObserverRef.current) {
          mutationObserverRef.current.disconnect();
          mutationObserverRef.current = null;
        }

        // Clear timeouts
        timeouts.forEach(clearTimeout);
      };
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
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
  }, [showTooltip, onClose]);

  const handleMouseEnter = () => {
    // On mobile, don't trigger hover events
    const isMobile = isMobileDevice();
    if (disabled || triggerOnClick || isMobile) return;

    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      if (onShow) {
        onShow(); // Call onShow callback before showing tooltip
      }
      setShowTooltip(true);
      // Update position after a short delay to ensure content is rendered
      setTimeout(updatePosition, 0);
    }, delay);
    hideTimeoutRef.current = timeout;
  };

  const handleMouseLeave = () => {
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

  const handleClick = () => {
    if (disabled) return;

    // On mobile, always use click mode regardless of triggerOnClick setting
    const isMobile = isMobileDevice();

    if (!triggerOnClick && !isMobile) return;

    const newShowState = !showTooltip;

    if (newShowState && onShow) {
      onShow(); // Call onShow callback before showing tooltip
    }

    setShowTooltip(newShowState);

    if (newShowState) {
      // Update position after a short delay to ensure content is rendered
      setTimeout(updatePosition, 0);
    } else if (onClose) {
      onClose();
    }
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
        style={{ display: 'inline-block' }}
      >
        {children}
      </Wrapper>
      {mounted &&
        showTooltip &&
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
