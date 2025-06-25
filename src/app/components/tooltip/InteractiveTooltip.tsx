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
    const tooltipRect = tooltipContentRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate available space
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewportWidth - triggerRect.right;

    // Determine vertical position
    let top: number;
    if (spaceBelow >= tooltipRect.height || spaceBelow >= spaceAbove) {
      // Position below if there's more space below or equal space
      top = triggerRect.bottom + 8;
    } else {
      // Position above if there's more space above
      top = triggerRect.top - tooltipRect.height - 8;
    }

    // Ensure tooltip stays within viewport vertically
    top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));

    // Determine horizontal position
    let left: number;
    if (
      spaceRight >= tooltipRect.width / 2 &&
      spaceLeft >= tooltipRect.width / 2
    ) {
      // Center if enough space on both sides
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    } else if (spaceRight >= tooltipRect.width) {
      // Align to left if more space on right
      left = triggerRect.left;
    } else if (spaceLeft >= tooltipRect.width) {
      // Align to right if more space on left
      left = triggerRect.right - tooltipRect.width;
    } else {
      // Center if no space on either side
      left = Math.max(
        8,
        Math.min(
          triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
          viewportWidth - tooltipRect.width - 8
        )
      );
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (showTooltip) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
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
              zIndex: 10001,
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
