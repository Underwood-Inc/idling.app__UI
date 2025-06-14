/**
 * LinkTooltip Component
 *
 * A sophisticated link preview component that provides both hover tooltips and modal previews.
 * Uses React Portals for optimal rendering and accessibility.
 *
 * Architecture:
 * 1. Two-Portal System:
 *    - Tooltip Portal: Renders the hover preview above content but below modals
 *    - Modal Portal: Renders the full-screen preview above everything
 *    This separation allows for:
 *    - Independent z-index management
 *    - Clean focus management
 *    - Better performance through selective rendering
 *
 * 2. Hydration Handling:
 *    - Uses suppressHydrationWarning to bypass React's DOM nesting validation
 *    - Safe because content is rendered in portals, not affecting parent DOM structure
 *    - Allows flexible use of any HTML elements within tooltips
 *
 * 3. Performance Optimizations:
 *    - Lazy loading of preview content
 *    - Caching with configurable duration
 *    - Debounced hover handling
 *    - Selective portal mounting
 *
 * 4. Timezone Support:
 *    - Auto-detects user's timezone
 *    - Allows timezone selection for timestamp display
 *    - Shows exact timestamp on hover
 *    - Updates relative time in real-time
 *
 * @param {string} url - The URL to preview
 * @param {React.ReactNode} children - The link element to wrap
 * @param {boolean} [enableExtendedPreview=false] - Enable larger preview with iframe
 * @param {boolean} [enableCtrlClick=false] - Enable Ctrl+Click for modal preview
 * @param {number} [cacheDuration=3600000] - Cache duration in milliseconds (default: 1 hour)
 * @param {boolean} [isInsideParagraph=false] - Whether the tooltip is inside a paragraph
 */

'use client';

import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInYears
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface TimezoneInfo {
  name: string;
  offset: string;
}

const CACHE_KEY_PREFIX = 'link_tooltip_cache_';
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatLastUpdated = (
  timestamp: number,
  timezone: string = DEFAULT_TIMEZONE
) => {
  if (!Number.isFinite(timestamp)) return '0s ago';
  const now = new Date(Date.now());
  const past = new Date(timestamp);
  if (past > now) return '0s ago';

  let years = differenceInYears(now, past);
  let months = differenceInMonths(now, addYears(past, years));
  let days = differenceInDays(now, addYears(addMonths(past, months), years));
  let hours = differenceInHours(
    now,
    addYears(addMonths(addDays(past, days), months), years)
  );
  let minutes = differenceInMinutes(
    now,
    addYears(addMonths(addDays(addHours(past, hours), days), months), years)
  );
  let seconds = differenceInSeconds(
    now,
    addYears(
      addMonths(
        addDays(addHours(addMinutes(past, minutes), hours), days),
        months
      ),
      years
    )
  );

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  } else if (months > 0) {
    parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  } else if (days > 0) {
    parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  } else if (hours > 0) {
    parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  } else if (minutes > 0) {
    parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  } else {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ') + ' ago';
};

export const getFormattedDateTime = (
  timestamp: number | string,
  timezone: string
): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return formatInTimeZone(date, timezone, 'PPpp zzz');
  } catch (error) {
    return 'Invalid date';
  }
};

export const getAvailableTimezones = (): TimezoneInfo[] => {
  return Intl.supportedValuesOf('timeZone').map((zone) => ({
    name: zone,
    offset: formatInTimeZone(new Date(), zone, 'xxx')
  }));
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
  const [mounted, setMounted] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(DEFAULT_TIMEZONE);
  const [availableTimezones, setAvailableTimezones] = useState<TimezoneInfo[]>(
    []
  );
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  const Wrapper = isInsideParagraph ? 'span' : 'div';

  // Filter timezones based on search
  const filteredTimezones = availableTimezones.filter(
    (tz) =>
      tz.name.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
      tz.offset.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

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

  useEffect(() => {
    setMounted(true);
    setAvailableTimezones(getAvailableTimezones());
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mounted && showTooltip) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [mounted, showTooltip]);

  const updatePosition = () => {
    if (!tooltipRef.current || !tooltipContentRef.current) return;

    const rect = tooltipRef.current.getBoundingClientRect();
    const tooltipRect = tooltipContentRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate available space
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.left;
    const spaceLeft = rect.left;

    // Determine vertical position
    let top = rect.bottom + window.scrollY;
    if (spaceBelow < tooltipRect.height && spaceAbove > spaceBelow) {
      top = rect.top - tooltipRect.height + window.scrollY;
    }

    // Determine horizontal position
    let left = rect.left + window.scrollX;
    if (spaceRight < tooltipRect.width && spaceLeft > spaceRight) {
      left = rect.right - tooltipRect.width + window.scrollX;
    }

    // Ensure tooltip stays within viewport bounds
    top = Math.max(
      0,
      Math.min(top, viewportHeight + window.scrollY - tooltipRect.height)
    );
    left = Math.max(
      0,
      Math.min(left, viewportWidth + window.scrollX - tooltipRect.width)
    );

    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowTooltip(false);
      }
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    isHoveringRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    isHoveringRef.current = false;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowTooltip(false);
      }
    }, 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (enableCtrlClick && e.ctrlKey) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const renderTooltipContent = () => {
    if (loading) {
      return (
        <div className="tooltip-loading">
          <div className="tooltip-spinner" />
          Loading preview...
        </div>
      );
    }

    if (error) {
      return <div className="tooltip-error">{error}</div>;
    }

    if (!tooltipData) {
      return null;
    }

    return (
      <>
        {enableCtrlClick && (
          <div className="tooltip-ctrl-message">
            Hold Ctrl and click to open in modal
          </div>
        )}
        <div className="tooltip-header">
          {tooltipData.image && (
            <img
              src={tooltipData.image}
              alt={tooltipData.title || 'Preview image'}
              className="tooltip-image"
            />
          )}
          <div className="tooltip-text">
            <h4 className="tooltip-title">{tooltipData.title}</h4>
            <p className="tooltip-description">{tooltipData.description}</p>
            <div className="tooltip-url">{url}</div>
          </div>
        </div>
        {enableExtendedPreview && (
          <iframe
            src={url}
            className="tooltip-iframe"
            sandbox="allow-same-origin allow-scripts"
            title="Link preview"
          />
        )}
        {isCached && lastUpdated && (
          <div className="tooltip-cache-info">
            <span
              className="tooltip-cache-time"
              title={getFormattedDateTime(
                lastUpdated.getTime(),
                selectedTimezone
              )}
            >
              Last updated: {timeAgo}
            </span>
            <select
              className="timezone-select"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
            >
              {availableTimezones.map((tz) => (
                <option key={tz.name} value={tz.name}>
                  {tz.name} ({tz.offset})
                </option>
              ))}
            </select>
            <button className="tooltip-refresh-button" onClick={handleRefresh}>
              Refresh
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <Wrapper
      ref={tooltipRef}
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      {mounted &&
        showTooltip &&
        createPortal(
          <div
            ref={tooltipContentRef}
            className="tooltip-content"
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 1000
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {renderTooltipContent()}
          </div>,
          document.body
        )}
      {mounted &&
        showModal &&
        createPortal(
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
                className="modal-iframe"
                sandbox="allow-same-origin allow-scripts"
                title="Link preview"
              />
            </div>
          </div>,
          document.body
        )}
    </Wrapper>
  );
};
