'use client';

import React, { useEffect, useState } from 'react';
import { TimestampWithTooltip } from '../ui/TimestampWithTooltip';
import './CacheStatus.css';

interface CacheInfo {
  isCached: boolean;
  cacheTimestamp?: Date;
  cacheAge?: string;
  version?: string;
  cacheVersion?: string;
  details?: {
    serviceWorker: boolean;
    cacheCount: number;
    cacheSize: number;
    localStorageSize: number;
  };
}

const formatTimeAgo = (timestamp: Date): string => {
  const now = Date.now();
  const then = timestamp.getTime();
  if (then > now) return '0s ago';

  let remaining = now - then;

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

  return parts.slice(0, 2).join(' ') + ' ago';
};

const CacheStatus: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ isCached: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getCacheMetadata = async (url: string) => {
    try {
      if ('caches' in window) {
        const metadataCache = await caches.open('idling-app-cache-metadata-v1');
        const metadataResponse = await metadataCache.match(`metadata-${url}`);

        if (metadataResponse) {
          const metadata = await metadataResponse.json();
          return {
            timestamp: new Date(metadata.cachedAt),
            originalTimestamp: metadata.timestamp
          };
        }
      }
    } catch (error) {
      console.warn('Failed to get cache metadata:', error);
    }
    return null;
  };

  const checkCacheStatus = async () => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('idling-app-cache-v1');
        const cachedResponse = await cache.match(window.location.pathname);

        if (cachedResponse) {
          // Try to get timestamp from enhanced metadata first
          const metadata = await getCacheMetadata(window.location.pathname);
          let timestamp: Date;

          if (metadata) {
            timestamp = metadata.timestamp;
          } else {
            // Fallback to response headers
            const cacheTimestampHeader =
              cachedResponse.headers.get('Cache-Timestamp');
            const cacheDateHeader = cachedResponse.headers.get('Cache-Date');

            if (cacheTimestampHeader) {
              timestamp = new Date(parseInt(cacheTimestampHeader));
            } else if (cacheDateHeader) {
              timestamp = new Date(cacheDateHeader);
            } else {
              // Last fallback to response date header
              const responseDate = cachedResponse.headers.get('date');
              timestamp = responseDate ? new Date(responseDate) : new Date();
            }
          }

          // Get additional cache details
          let cacheCount = 0;
          let cacheSize = 0;
          let appVersion = 'unknown';
          let cacheVersion = 'unknown';
          let hasServiceWorker = false;

          try {
            // Check service worker status
            if ('serviceWorker' in navigator) {
              const registration =
                await navigator.serviceWorker.getRegistration();
              hasServiceWorker = !!registration;
            }

            // Get cache storage info
            const cacheNames = await caches.keys();
            cacheCount = cacheNames.length;

            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              cacheSize += requests.length;

              // Try to get version info from any cached response
              if (requests.length > 0) {
                const response = await cache.match(requests[0]);
                if (response) {
                  appVersion =
                    response.headers.get('X-App-Version') || appVersion;
                  cacheVersion =
                    response.headers.get('SW-Cache-Version') || cacheVersion;
                }
              }
            }
          } catch (e) {
            console.warn('Error getting cache details:', e);
          }

          // Check localStorage size
          let localStorageSize = 0;
          try {
            for (const key in localStorage) {
              if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
                localStorageSize += localStorage[key].length + key.length;
              }
            }
          } catch (e) {
            console.warn('Error checking localStorage:', e);
          }

          setCacheInfo({
            isCached: true,
            cacheTimestamp: timestamp,
            cacheAge: formatTimeAgo(timestamp),
            version: appVersion,
            cacheVersion,
            details: {
              serviceWorker: hasServiceWorker,
              cacheCount,
              cacheSize,
              localStorageSize: Math.round(localStorageSize / 1024) // KB
            }
          });
        } else {
          setCacheInfo({ isCached: false });
        }
      }
    } catch (error) {
      console.warn('Failed to check cache status:', error);
      setCacheInfo({ isCached: false });
    }
  };

  const refreshCache = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker messaging for more reliable cache refresh
        const messageChannel = new MessageChannel();

        const refreshPromise = new Promise((resolve, reject) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error));
            }
          };
        });

        navigator.serviceWorker.controller.postMessage(
          {
            type: 'REFRESH_CACHE',
            url: window.location.href
          },
          [messageChannel.port2]
        );

        await refreshPromise;

        // Update cache info after successful refresh
        await checkCacheStatus();

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('cache-updated'));

        // Small delay to show the updated cache status before reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // Fallback to manual cache refresh
        const response = await fetch(window.location.href, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

        if (response.ok) {
          // Update cache status to show it's now fresh
          await checkCacheStatus();

          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('cache-updated'));

          // Small delay to show the updated status
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      // Fallback: hard reload
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkCacheStatus();

    // Listen for cache updates from service worker or other sources
    const handleCacheUpdate = () => {
      checkCacheStatus();
    };

    window.addEventListener('cache-updated', handleCacheUpdate);

    return () => {
      window.removeEventListener('cache-updated', handleCacheUpdate);
    };
  }, []); // Run once on mount

  useEffect(() => {
    // Update cache age every 30 seconds
    const interval = setInterval(() => {
      if (cacheInfo.isCached && cacheInfo.cacheTimestamp) {
        setCacheInfo((prev) => ({
          ...prev,
          cacheAge: formatTimeAgo(prev.cacheTimestamp!)
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cacheInfo.isCached, cacheInfo.cacheTimestamp]);

  const getCacheStatusText = () => {
    if (!cacheInfo.isCached) return 'Live';

    // If we have cache storage but no specific page cache timestamp, show general cache status
    if (!cacheInfo.cacheTimestamp) {
      return 'Cached';
    }

    // Use the abbreviated timestamp component for compact footer display
    return (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
      >
        Cached{' '}
        <TimestampWithTooltip date={cacheInfo.cacheTimestamp} abbreviated />
      </span>
    );
  };

  if (!cacheInfo.isCached) {
    return (
      <div className="cache-status">
        <span className="cache-status__indicator cache-status__indicator--live">
          ●
        </span>
        <span className="cache-status__text">Live</span>
      </div>
    );
  }

  return (
    <div className="cache-status">
      <span className="cache-status__indicator cache-status__indicator--cached">
        ●
      </span>
      <span
        className="cache-status__text"
        onClick={() => setShowDetails(!showDetails)}
        style={{ cursor: 'pointer' }}
        title="Click for cache details"
      >
        {getCacheStatusText()}
      </span>
      <button
        className="cache-status__refresh"
        onClick={refreshCache}
        disabled={isRefreshing}
        title="Refresh to latest version"
        aria-label="Refresh cache to get latest version"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>

      {showDetails && cacheInfo.isCached && (
        <div className="cache-status__details">
          <div className="cache-status__detail-item">
            <strong>Page Cache:</strong>
            <div>Version: {cacheInfo.version || 'unknown'}</div>
            <div>Cache Version: {cacheInfo.cacheVersion || 'unknown'}</div>
            {cacheInfo.cacheTimestamp && (
              <div>
                Last cached:{' '}
                <TimestampWithTooltip date={cacheInfo.cacheTimestamp} />
              </div>
            )}
          </div>

          {cacheInfo.details && (
            <div className="cache-status__detail-item">
              <strong>Storage Details:</strong>
              <div>Cache Count: {cacheInfo.details.cacheCount}</div>
              <div>Cache Size: {cacheInfo.details.cacheSize} entries</div>
              <div>LocalStorage: {cacheInfo.details.localStorageSize} KB</div>
              <div>
                Service Worker:{' '}
                {cacheInfo.details.serviceWorker ? '✅ Active' : '❌ Inactive'}
              </div>
            </div>
          )}

          <div className="cache-status__detail-item">
            <strong>Actions:</strong>
            <div>↻ Refresh to latest version</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStatus;
