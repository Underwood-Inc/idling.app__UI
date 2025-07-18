import React from 'react';
import { InstantLink } from '../ui/InstantLink';
import { TimestampWithTooltip } from '../ui/TimestampWithTooltip';
import './TooltipContent.css';

interface TooltipContentProps {
  loading: boolean;
  error: string | null;
  tooltipData: any;
  enableExtendedPreview: boolean;
  isCached: boolean;
  lastUpdated: Date | null;
  url: string;
  onRefresh: () => void;
  onClick: (e: React.MouseEvent) => void;
  cacheStats?: {
    entryCount: number;
    totalSizeMB: string;
    maxEntries: number;
    maxSizeMB: string;
  } | null;
  onClearCache?: () => void;
}

// Utility function to detect mobile devices
const isMobileDevice = () => {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
};

export const TooltipContent: React.FC<TooltipContentProps> = ({
  loading,
  error,
  tooltipData,
  enableExtendedPreview,
  isCached,
  lastUpdated,
  url,
  onRefresh,
  onClick,
  cacheStats,
  onClearCache
}) => {
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
    return <div className="tooltip-error">No preview available</div>;
  }

  const renderCacheInfo = () => (
    <div className="tooltip-cache-info">
      <span>Cached content</span>
      {lastUpdated && (
        <span className="tooltip-cache-time">
          Last updated:&nbsp;
          <TimestampWithTooltip date={lastUpdated} abbreviated />
        </span>
      )}
      <button
        className="tooltip-refresh-button"
        onClick={(e) => {
          e.stopPropagation();
          onRefresh();
        }}
      >
        Refresh
      </button>
      {cacheStats && (
        <div className="tooltip-cache-stats">
          <small>
            Cache: {cacheStats.entryCount}/{cacheStats.maxEntries} items (
            {cacheStats.totalSizeMB}MB/{cacheStats.maxSizeMB}MB)
          </small>
          {onClearCache && (
            <button
              className="tooltip-clear-cache-button"
              onClick={(e) => {
                e.stopPropagation();
                onClearCache();
              }}
              title="Clear all cached tooltips"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Mobile-specific link button
  const renderMobileLinkButton = () => {
    if (!isMobileDevice()) return null;

    return (
      <div className="tooltip-mobile-link">
        <InstantLink
          href={url}
          target="_blank"
          className="tooltip-mobile-link-button"
          onClick={(e) => e.stopPropagation()}
        >
          Visit Link →
        </InstantLink>
      </div>
    );
  };

  if (enableExtendedPreview) {
    return (
      <div className="tooltip-content" onClick={onClick}>
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
        {renderMobileLinkButton()}
      </div>
    );
  }

  return (
    <div className="link-tooltip-content" onClick={onClick}>
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
      {renderMobileLinkButton()}
    </div>
  );
};
