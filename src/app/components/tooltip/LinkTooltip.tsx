'use client';

import React, { useEffect, useRef, useState } from 'react';
import './LinkTooltip.css';

interface LinkTooltipProps {
  url: string;
  children: React.ReactNode;
  enableExtendedPreview?: boolean;
  enableCtrlClick?: boolean;
  cacheDuration?: number; // Duration in milliseconds, default 1 hour
  isInsideParagraph?: boolean;
}

interface CachedData {
  data: any;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'link_tooltip_cache_';
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const formatLastUpdated = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const parts: string[] = [];

  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

  return parts.join(' ') + ' ago';
};

export const LinkTooltip: React.FC<LinkTooltipProps> = ({
  url,
  children,
  enableExtendedPreview = false,
  enableCtrlClick = false,
  cacheDuration = DEFAULT_CACHE_DURATION,
  isInsideParagraph = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLargePreview, setShowLargePreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHoveringRef = useRef(false);
  const shouldFetchRef = useRef(true);

  const getCacheKey = (url: string) => `${CACHE_KEY_PREFIX}${url}`;

  const getCachedData = (url: string): CachedData | null => {
    const cacheKey = getCacheKey(url);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp > cacheDuration) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return { data, timestamp };
  };

  const setCachedData = (url: string, data: any) => {
    const cacheKey = getCacheKey(url);
    const cacheData: CachedData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  };

  useEffect(() => {
    if (lastUpdated) {
      // Update immediately
      setTimeAgo(formatLastUpdated(lastUpdated.getTime()));

      // Then update every second for more precise timing
      timerRef.current = setInterval(() => {
        setTimeAgo(formatLastUpdated(lastUpdated.getTime()));
      }, 1000); // Update every second
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lastUpdated]);

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
        setShowLargePreview(false);
        shouldFetchRef.current = true;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      const now = new Date();
      setTooltipData(data);
      setCachedData(url, data);
      setIsCached(true);
      setLastUpdated(now);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    if (!shouldFetchRef.current) return;
    shouldFetchRef.current = false;

    setLoading(true);
    setError(null);

    // Check cache first
    const cached = getCachedData(url);
    if (cached) {
      setTooltipData(cached.data);
      setIsCached(true);
      setLastUpdated(new Date(cached.timestamp));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      setTooltipData(data);
      setCachedData(url, data);
      setIsCached(false);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showTooltip) {
      fetchPreview();
    }
  }, [showTooltip]);

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

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    const timeout = setTimeout(() => {
      setShowTooltip(true);
      if (enableExtendedPreview) {
        setShowLargePreview(true);
      }
      // Update position after a short delay to ensure content is rendered
      setTimeout(updatePosition, 0);
    }, 500);
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
        setShowLargePreview(false);
        shouldFetchRef.current = true;
      }
    }, 1500);
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

  const handleClick = (e: React.MouseEvent) => {
    if (enableCtrlClick && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const renderTooltipContent = () => {
    if (loading) {
      return <div className="link-tooltip-loading">Loading preview...</div>;
    }

    if (error) {
      return <div className="link-tooltip-error">{error}</div>;
    }

    if (!tooltipData) {
      return null;
    }

    const renderCacheInfo = () => (
      <div className="tooltip-cache-info">
        <span>Cached content</span>
        {lastUpdated && (
          <span className="tooltip-cache-time">Last updated: {timeAgo}</span>
        )}
        <button
          className="tooltip-refresh-button"
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
        >
          Refresh
        </button>
      </div>
    );

    if (showLargePreview) {
      return (
        <div className="tooltip-content" onClick={handleClick}>
          {isCached && renderCacheInfo()}
          <div className="tooltip-header">
            {tooltipData.image && (
              <img src={tooltipData.image} alt={tooltipData.title} />
            )}
            <h3 className="tooltip-title">{tooltipData.title}</h3>
          </div>
          {tooltipData.description && (
            <p className="tooltip-description">{tooltipData.description}</p>
          )}
          <iframe
            src={url}
            className="tooltip-iframe"
            sandbox="allow-same-origin allow-scripts"
          />
          <div className="tooltip-footer">
            {tooltipData.favicon && (
              <img src={tooltipData.favicon} alt="Site favicon" />
            )}
            <span>{tooltipData.url}</span>
          </div>
        </div>
      );
    }

    return (
      <div onClick={handleClick}>
        {isCached && renderCacheInfo()}
        {tooltipData.image && (
          <div className="link-tooltip-image">
            <img src={tooltipData.image} alt={tooltipData.title} />
          </div>
        )}
        <div className="link-tooltip-content">
          <div className="link-tooltip-text">
            <h4>{tooltipData.title}</h4>
            {tooltipData.description && <p>{tooltipData.description}</p>}
          </div>
          <div className="link-tooltip-url">{tooltipData.url}</div>
        </div>
      </div>
    );
  };

  const Wrapper = isInsideParagraph ? 'span' : 'div';

  return (
    <Wrapper
      ref={tooltipRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ display: 'inline-block' }}
    >
      {children}
      {showTooltip && (
        <div
          ref={tooltipContentRef}
          className={`link-tooltip ${showLargePreview ? 'large' : ''} ${showTooltip ? 'visible' : ''}`}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          {enableCtrlClick && (
            <div className="link-tooltip-ctrl-message">
              Hold Ctrl and click to open in modal
            </div>
          )}
          {renderTooltipContent()}
        </div>
      )}
      {showModal && enableCtrlClick && (
        <div className="link-preview-modal" onClick={handleModalClose}>
          <div
            className="link-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="link-preview-modal-close"
              onClick={handleModalClose}
            >
              ×
            </button>
            <iframe
              src={url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      )}
    </Wrapper>
  );
};
