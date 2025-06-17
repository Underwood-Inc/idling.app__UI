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

export const formatLastUpdated = (timestamp: number) => {
  const now = Date.now();
  if (timestamp > now) return '0s ago';

  let remaining = now - timestamp;

  const years = Math.floor(remaining / (365 * 24 * 60 * 60 * 1000));
  remaining -= years * 365 * 24 * 60 * 60 * 1000;

  const months = Math.floor(remaining / (30 * 24 * 60 * 60 * 1000));
  remaining -= months * 30 * 24 * 60 * 60 * 1000;

  const weeks = Math.floor(remaining / (7 * 24 * 60 * 60 * 1000));
  remaining -= weeks * 7 * 24 * 60 * 60 * 1000;

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  remaining -= days * 24 * 60 * 60 * 1000;

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  remaining -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(remaining / (60 * 1000));
  remaining -= minutes * 60 * 1000;

  const seconds = Math.floor(remaining / 1000);

  const parts: string[] = [];
  if (years) parts.push(`${years}y`);
  if (months) parts.push(`${months}mo`);
  if (weeks) parts.push(`${weeks}w`);
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const modalContentRef = useRef<HTMLDivElement>(null);
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
    if (showModal) return; // Don't show tooltip if modal is open
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
    if (showModal) return; // Don't handle tooltip mouse events if modal is open
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (showModal) return; // Don't handle tooltip mouse events if modal is open
    handleMouseLeave();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (enableCtrlClick && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowTooltip(false);
      setShowLargePreview(false);
      setShowModal(true);
    } else {
      e.preventDefault();
      window.open(url, '_blank');
    }
  };

  const handleModalClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Add effect to manage body class when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
      setShowTooltip(false);
      setShowLargePreview(false);
      shouldFetchRef.current = true;
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal]);

  const handleFullscreenToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  const handleControlsToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowControls(!showControls);
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
      <div className="link-tooltip-content" onClick={handleClick}>
        {isCached && renderCacheInfo()}
        {tooltipData.image && (
          <div className="link-tooltip-image">
            <img src={tooltipData.image} alt={tooltipData.title} />
          </div>
        )}
        <div className="link-tooltip-text">
          <div className="link-tooltip-title">{tooltipData.title}</div>
          {tooltipData.description && (
            <div className="link-tooltip-description">
              {tooltipData.description}
            </div>
          )}
        </div>
        <div className="link-tooltip-url">{tooltipData.url}</div>
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
          style={position}
          data-testid="link-tooltip"
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
        <div
          className="link-preview-modal"
          data-testid="link-preview-modal"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            ref={modalContentRef}
            className={`link-preview-modal-content ${isFullscreen ? 'fullscreen' : ''}`}
            onClick={handleModalContentClick}
          >
            <div
              className={`modal-controls ${showControls ? 'visible' : 'hidden'}`}
            >
              <div className="modal-controls-buttons">
                <button
                  className="modal-control-button fullscreen-toggle"
                  onClick={handleFullscreenToggle}
                  aria-label={
                    isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                  }
                >
                  {isFullscreen ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  )}
                </button>
                <button
                  className="modal-control-button close-button"
                  onClick={handleModalClose}
                  aria-label="Close modal"
                >
                  ×
                </button>
                <button
                  className="modal-control-button toggle-button"
                  onClick={handleControlsToggle}
                  aria-label="Hide controls"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: 'rotate(180deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            {!showControls && (
              <button
                className="modal-control-button toggle-button restore-button"
                onClick={handleControlsToggle}
                aria-label="Show controls"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
            )}
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

interface MentionTooltipProps {
  username: string;
  onFilterByAuthor: () => void;
  onFilterByContent: () => void;
  onClose: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  position: { x: number; y: number };
}

export function MentionTooltip({
  username,
  onFilterByAuthor,
  onFilterByContent,
  onClose,
  onHover,
  onLeave,
  position
}: MentionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={tooltipRef}
      className="mention-tooltip"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000
      }}
    >
      <div className="mention-tooltip__header">Filter by @{username}</div>
      <div className="mention-tooltip__options">
        <button
          className="mention-tooltip__option mention-tooltip__option--primary"
          onClick={onFilterByAuthor}
          title="Show posts authored by this user"
        >
          <span className="mention-tooltip__icon">👤</span>
          Filter by Author
          <span className="mention-tooltip__description">
            Posts by this user
          </span>
        </button>
        <button
          className="mention-tooltip__option"
          onClick={onFilterByContent}
          title="Show posts that mention this user"
        >
          <span className="mention-tooltip__icon">💬</span>
          Filter by Mentions
          <span className="mention-tooltip__description">
            Posts mentioning this user
          </span>
        </button>
      </div>
    </div>
  );
}
