'use client';

import React, { useEffect, useState } from 'react';
import './CacheStatus.css';

interface CacheInfo {
  isCached: boolean;
  cacheTimestamp?: Date;
  cacheAge?: string;
  version?: string;
  cacheVersion?: string;
  isStale?: boolean;
  ttl?: number;
}

interface ServiceWorkerCacheInfo {
  version: string;
  totalEntries: number;
  ttls: {
    static: number;
    dynamic: number;
    api: number;
    images: number;
  };
  timestamp: number;
}

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
};

const SmartCacheStatus: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ isCached: false });
  const [swCacheInfo, setSwCacheInfo] = useState<ServiceWorkerCacheInfo | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getCacheMetadata = async (url: string) => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const currentCache = cacheNames.find((name) =>
          name.includes('idling-app-cache-v')
        );

        if (currentCache) {
          const cache = await caches.open(currentCache);
          const cachedResponse = await cache.match(url);

          if (cachedResponse) {
            const cacheTimestamp =
              cachedResponse.headers.get('Cache-Timestamp');
            const cacheTTL = cachedResponse.headers.get('Cache-TTL');
            const cacheVersion = cachedResponse.headers.get('SW-Cache-Version');
            const appVersion = cachedResponse.headers.get('X-App-Version');

            if (cacheTimestamp) {
              const timestamp = new Date(parseInt(cacheTimestamp));
              const ttl = cacheTTL ? parseInt(cacheTTL) : 300000; // 5 min default
              const age = Date.now() - timestamp.getTime();
              const isStale = age > ttl;

              return {
                timestamp,
                version: appVersion || undefined,
                cacheVersion: cacheVersion || undefined,
                isStale,
                ttl
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache metadata:', error);
    }
    return null;
  };

  const getServiceWorkerCacheInfo =
    async (): Promise<ServiceWorkerCacheInfo | null> => {
      try {
        if (
          'serviceWorker' in navigator &&
          navigator.serviceWorker.controller
        ) {
          const messageChannel = new MessageChannel();

          const infoPromise = new Promise<ServiceWorkerCacheInfo>(
            (resolve, reject) => {
              messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                  resolve(event.data.cacheInfo);
                } else {
                  reject(new Error(event.data.error));
                }
              };
            }
          );

          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_CACHE_INFO' },
            [messageChannel.port2]
          );

          return await infoPromise;
        }
      } catch (error) {
        console.warn('Failed to get service worker cache info:', error);
      }
      return null;
    };

  const checkCacheStatus = async () => {
    try {
      const url = window.location.pathname;
      const metadata = await getCacheMetadata(url);
      const swInfo = await getServiceWorkerCacheInfo();

      setSwCacheInfo(swInfo);

      if (metadata) {
        setCacheInfo({
          isCached: true,
          cacheTimestamp: metadata.timestamp,
          cacheAge: formatTimeAgo(metadata.timestamp.getTime()),
          version: metadata.version,
          cacheVersion: metadata.cacheVersion,
          isStale: metadata.isStale,
          ttl: metadata.ttl
        });
      } else {
        setCacheInfo({ isCached: false });
      }
    } catch (error) {
      console.warn('Failed to check cache status:', error);
      setCacheInfo({ isCached: false });
    }
  };

  const refreshCache = async (clearAll = false) => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
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
            url: clearAll ? undefined : window.location.href
          },
          [messageChannel.port2]
        );

        await refreshPromise;

        // Wait a moment for cache to be updated
        setTimeout(async () => {
          await checkCacheStatus();
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('cache-updated'));
        }, 200);
      } else {
        // Fallback: manual refresh with cache busting
        const response = await fetch(window.location.href, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

        if (response.ok) {
          // Wait a moment for cache to be updated
          setTimeout(async () => {
            await checkCacheStatus();
            window.dispatchEvent(new CustomEvent('cache-updated'));
          }, 200);
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

    // Listen for cache updates
    const handleCacheUpdate = () => {
      checkCacheStatus();
    };

    window.addEventListener('cache-updated', handleCacheUpdate);

    // Update cache age every 30 seconds
    const interval = setInterval(() => {
      if (cacheInfo.isCached && cacheInfo.cacheTimestamp) {
        setCacheInfo((prev) => ({
          ...prev,
          cacheAge: formatTimeAgo(prev.cacheTimestamp!.getTime())
        }));
      }
    }, 30000);

    return () => {
      window.removeEventListener('cache-updated', handleCacheUpdate);
      clearInterval(interval);
    };
  }, []);

  const getCacheStatusColor = () => {
    if (!cacheInfo.isCached) return 'cache-status__indicator--live';
    if (cacheInfo.isStale) return 'cache-status__indicator--stale';
    return 'cache-status__indicator--cached';
  };

  const getCacheStatusText = () => {
    if (!cacheInfo.isCached) return 'Live';
    if (cacheInfo.isStale) return `Stale ${cacheInfo.cacheAge}`;
    return `Cached ${cacheInfo.cacheAge}`;
  };

  return (
    <div className="cache-status">
      <span className={`cache-status__indicator ${getCacheStatusColor()}`}>
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
        onClick={() => refreshCache(false)}
        disabled={isRefreshing}
        title="Refresh current page cache"
        aria-label="Refresh current page cache"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>

      <button
        className="cache-status__refresh"
        onClick={() => refreshCache(true)}
        disabled={isRefreshing}
        title="Clear all cache"
        aria-label="Clear all cache"
        style={{ marginLeft: '4px' }}
      >
        {isRefreshing ? '⟳' : '🧹'}
      </button>

      {showDetails && (cacheInfo.isCached || swCacheInfo) && (
        <div className="cache-status__details">
          {cacheInfo.isCached && (
            <div className="cache-status__detail-item">
              <strong>Page Cache:</strong>
              <div>Version: {cacheInfo.version || 'unknown'}</div>
              <div>Cache Version: {cacheInfo.cacheVersion || 'unknown'}</div>
              <div>
                TTL:{' '}
                {cacheInfo.ttl ? Math.round(cacheInfo.ttl / 1000 / 60) : '?'}{' '}
                min
              </div>
              <div>Status: {cacheInfo.isStale ? '⚠️ Stale' : '✅ Fresh'}</div>
            </div>
          )}

          {swCacheInfo && (
            <div className="cache-status__detail-item">
              <strong>Service Worker:</strong>
              <div>Cache Version: {swCacheInfo.version}</div>
              <div>Total Entries: {swCacheInfo.totalEntries}</div>
              <div>
                TTLs: API {Math.round(swCacheInfo.ttls.api / 1000 / 60)}m,
                Dynamic {Math.round(swCacheInfo.ttls.dynamic / 1000 / 60)}m
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCacheStatus;
