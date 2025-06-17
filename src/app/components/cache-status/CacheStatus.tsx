'use client';

import React, { useEffect, useState } from 'react';
import './CacheStatus.css';

interface CacheInfo {
  isCached: boolean;
  cacheTimestamp?: Date;
  cacheAge?: string;
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

          setCacheInfo({
            isCached: true,
            cacheTimestamp: timestamp,
            cacheAge: formatTimeAgo(timestamp)
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

        // Reload page to show fresh content
        window.location.reload();
      } else {
        // Fallback to manual cache refresh
        const response = await fetch(window.location.href, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

        if (response.ok) {
          window.location.reload();
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
      <span className="cache-status__text">Cached {cacheInfo.cacheAge}</span>
      <button
        className="cache-status__refresh"
        onClick={refreshCache}
        disabled={isRefreshing}
        title="Refresh to latest version"
        aria-label="Refresh cache to get latest version"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>
    </div>
  );
};

export default CacheStatus;
