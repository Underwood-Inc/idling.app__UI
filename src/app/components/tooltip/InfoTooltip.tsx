'use client';

import React, { useEffect, useRef, useState } from 'react';
import './LinkTooltip.css';

interface InfoTooltipProps {
  content: string;
  children: React.ReactNode;
  isInsideParagraph?: boolean;
  disabled?: boolean;
  delay?: number; // Delay before showing tooltip in milliseconds
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children,
  isInsideParagraph = false,
  disabled = false,
  delay = 300
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);

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
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const handleMouseEnter = () => {
    if (disabled) return;

    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      setShowTooltip(true);
      // Update position after a short delay to ensure content is rendered
      setTimeout(updatePosition, 0);
    }, delay);
    hideTimeoutRef.current = timeout;
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowTooltip(false);
      }
    }, 100);
    hideTimeoutRef.current = timeout;
  };

  const handleTooltipMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
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

  const Wrapper = isInsideParagraph ? 'span' : 'div';

  return (
    <Wrapper
      ref={tooltipRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block' }}
    >
      {children}
      {showTooltip && content && (
        <div
          ref={tooltipContentRef}
          className={`link-tooltip info-tooltip ${showTooltip ? 'visible' : ''}`}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          style={position}
          data-testid="info-tooltip"
        >
          <div className="info-tooltip-content">{content}</div>
        </div>
      )}
    </Wrapper>
  );
};
