'use client';

import { createLogger } from '@lib/logging';
import React, { useCallback, useEffect, useState } from 'react';
import { TimestampWithTooltip } from '../ui/TimestampWithTooltip';
import './CacheStatus.css';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'SmartCacheStatus',
    module: 'components/cache-status'
  },
  enabled: false
});

interface CacheInfo {
  isCached: boolean;
  cacheTimestamp?: Date;
  version?: string;
  cacheVersion?: string;
  isStale?: boolean;
  ttl?: number;
  details?: {
    serviceWorker: boolean;
    cacheCount: number;
    cacheSize: number;
    localStorageSize: number;
  };
}

interface ServiceWorkerCacheInfo {
  version: string;
  totalEntries: number;
  ttls: {
    api: number;
    dynamic: number;
    static: number;
    images: number;
  };
}

interface CacheMetadata {
  timestamp: Date;
  version?: string;
  cacheVersion?: string;
  isStale: boolean;
  ttl: number;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp); // Ensure non-negative

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

const SmartCacheStatus: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ isCached: false });
  const [swCacheInfo, setSwCacheInfo] = useState<ServiceWorkerCacheInfo | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getCacheMetadata = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();

        const metadataPromise = new Promise<CacheMetadata>(
          (resolve, reject) => {
            messageChannel.port1.onmessage = (event) => {
              if (event.data.success) {
                resolve(event.data.metadata);
              } else {
                reject(new Error(event.data.error));
              }
            };
          }
        );

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_METADATA', url: window.location.href },
          [messageChannel.port2]
        );

        return await metadataPromise;
      }
    } catch (error) {
      logger.group('getCacheMetadata');
      logger.warn('Failed to get cache metadata', {
        error: error instanceof Error ? error.message : String(error),
        hasServiceWorker: 'serviceWorker' in navigator,
        hasController: navigator.serviceWorker?.controller !== null
      });
      logger.groupEnd();
      return null;
    }
  }, []);

  const getServiceWorkerCacheInfo =
    useCallback(async (): Promise<ServiceWorkerCacheInfo | null> => {
      try {
        if (
          'serviceWorker' in navigator &&
          navigator.serviceWorker.controller
        ) {
          const messageChannel = new MessageChannel();

          return new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
              resolve(event.data);
            };

            navigator.serviceWorker.controller!.postMessage(
              { type: 'GET_CACHE_INFO' },
              [messageChannel.port2]
            );

            // Timeout after 2 seconds
            setTimeout(() => resolve(null), 2000);
          });
        }
        return null;
      } catch (error) {
        logger.group('getServiceWorkerCacheInfo');
        logger.warn('Failed to get service worker cache info', {
          error: error instanceof Error ? error.message : String(error),
          hasCaches: 'caches' in window
        });
        logger.groupEnd();
        return null;
      }
    }, []);

  const checkCacheStatus = useCallback(async () => {
    try {
      // Check current page cache metadata
      const pageMetadata = await getCacheMetadata();

      // Get service worker cache info
      const swInfo = await getServiceWorkerCacheInfo();
      setSwCacheInfo(swInfo);

      // Check if service worker is available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const hasServiceWorker = !!registration;

        // Check cache storage
        let cacheSize = 0;
        let cacheCount = 0;
        let appVersion = 'unknown';
        let cacheVersion = 'unknown';
        let currentPageCached = false;
        let currentPageTimestamp: Date | undefined;

        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            cacheCount = cacheNames.length;

            // Check if current page is cached and get app version info
            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              cacheSize += requests.length;

              // Check if current page URL is in this cache
              const currentPageResponse = await cache.match(
                window.location.href
              );
              if (currentPageResponse) {
                currentPageCached = true;
                // Try to get timestamp from response headers
                const cacheTimestamp =
                  currentPageResponse.headers.get('Cache-Timestamp');
                const cacheDate = currentPageResponse.headers.get('Cache-Date');
                const responseDate = currentPageResponse.headers.get('date');

                if (cacheTimestamp) {
                  currentPageTimestamp = new Date(parseInt(cacheTimestamp));
                } else if (cacheDate) {
                  currentPageTimestamp = new Date(cacheDate);
                } else if (responseDate) {
                  currentPageTimestamp = new Date(responseDate);
                }
              }

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
            logger.warn('Error checking cache storage', {
              error: e instanceof Error ? e.message : String(e)
            });
          }
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
          logger.warn('Error checking localStorage', {
            error: e instanceof Error ? e.message : String(e)
          });
        }

        // Use page metadata if available, otherwise use detected cache info
        const finalTimestamp = pageMetadata?.timestamp || currentPageTimestamp;

        // Ensure we have a timestamp for cached content - use current time as fallback
        const isCachedContent =
          currentPageCached ||
          hasServiceWorker ||
          cacheCount > 0 ||
          localStorageSize > 0;
        const cacheTimestamp =
          finalTimestamp || (isCachedContent ? new Date() : undefined);

        const newCacheInfo = {
          isCached: isCachedContent,
          cacheTimestamp: cacheTimestamp,
          version: appVersion,
          cacheVersion,
          isStale: pageMetadata?.isStale || false,
          ttl: pageMetadata?.ttl || 300000, // 5 min default
          details: {
            serviceWorker: hasServiceWorker,
            cacheCount,
            cacheSize,
            localStorageSize: Math.round(localStorageSize / 1024) // KB
          }
        };

        // Debug logging to help diagnose timestamp issues
        if (process.env.NODE_ENV === 'development') {
          logger.group('checkCacheStatus');
          logger.debug('Cache Status Debug', {
            isCachedContent,
            finalTimestamp,
            cacheTimestamp,
            currentPageCached,
            hasServiceWorker,
            cacheCount,
            localStorageSize
          });
          logger.groupEnd();
        }

        setCacheInfo(newCacheInfo);
      }
    } catch (error) {
      logger.group('checkCacheStatus');
      logger.warn('Failed to check cache status', {
        error: error instanceof Error ? error.message : String(error)
      });
      logger.groupEnd();
      // Set fallback cache info
      setCacheInfo({
        isCached: false,
        version: 'unknown',
        cacheVersion: 'unknown',
        ttl: 300000
      });
    }
  }, [getCacheMetadata, getServiceWorkerCacheInfo]);

  /**
   * Refresh current page cache - equivalent to "Empty cache and hard refresh"
   */
  const handleRefreshCurrentPage = async () => {
    setIsRefreshing(true);
    try {
      // Force a hard refresh of the current page
      window.location.reload();
    } catch (error) {
      // Silent error handling
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Clear all cache - logout user, unregister service workers, clear all caches, and re-register
   */
  const handleClearAllCache = async () => {
    if (isClearing) return;

    setIsClearing(true);

    try {
      // 1. Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear IndexedDB
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map((db) => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
        } catch (e) {
          // Silent error handling
        }
      }

      // 3. Clear WebSQL (deprecated but still present in some browsers)
      if ('webkitStorageInfo' in window) {
        try {
          const webkitStorageInfo = (window as any).webkitStorageInfo;
          if (webkitStorageInfo && webkitStorageInfo.requestQuota) {
            webkitStorageInfo.requestQuota(
              0,
              0,
              () => {},
              () => {}
            );
          }
        } catch (e) {
          // Silent error handling
        }
      }

      // 4. Send message to service worker to clear all caches
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const messageChannel = new MessageChannel();

          const clearPromise = new Promise((resolve, reject) => {
            messageChannel.port1.onmessage = (event) => {
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error));
              }
            };
          });

          navigator.serviceWorker.controller.postMessage(
            { type: 'REFRESH_CACHE' }, // No URL = clear all
            [messageChannel.port2]
          );

          await clearPromise;
        } catch (e) {
          // Silent error handling
        }
      }

      // 5. Unregister ALL service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map((registration) => registration.unregister())
          );
        } catch (e) {
          // Silent error handling
        }
      }

      // 6. Clear browser caches if available
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        } catch (e) {
          // Silent error handling
        }
      }

      // 7. Re-register service worker with fresh state
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
        } catch (e) {
          // Silent error handling
        }
      }

      // 8. Force hard refresh to complete the reset
      window.location.href = '/';
    } catch (error) {
      // Silent error handling
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    checkCacheStatus();

    // Listen for cache updates
    const handleCacheUpdate = () => {
      checkCacheStatus();
    };

    window.addEventListener('cache-updated', handleCacheUpdate);

    return () => {
      window.removeEventListener('cache-updated', handleCacheUpdate);
    };
  }, []); // Remove checkCacheStatus dependency to prevent infinite loop

  const getCacheStatusColor = () => {
    if (!cacheInfo.isCached) return 'cache-status__indicator--live';
    if (cacheInfo.isStale) return 'cache-status__indicator--stale';
    return 'cache-status__indicator--cached';
  };

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
        onClick={handleRefreshCurrentPage}
        disabled={isRefreshing || isClearing}
        title="Refresh current page cache (hard refresh)"
        aria-label="Empty cache and hard refresh current page"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>

      <button
        className="cache-status__refresh"
        onClick={handleClearAllCache}
        disabled={isRefreshing || isClearing}
        title="Logout user, clear all site data (cache, storage, cookies), and restart service workers"
        aria-label="Complete logout and clear all site data"
        style={{ marginLeft: '4px' }}
      >
        {isClearing ? '⟳' : '🧹'}
      </button>

      {showDetails && (cacheInfo.isCached || swCacheInfo) && (
        <div className="cache-status__details">
          <div className="cache-status__detail-item">
            <strong>Page Cache:</strong>
            <div>Version: {cacheInfo.version || 'unknown'}</div>
            <div>Cache Version: {cacheInfo.cacheVersion || 'unknown'}</div>
            <div>
              TTL: {cacheInfo.ttl ? Math.round(cacheInfo.ttl / 1000 / 60) : '?'}{' '}
              min
            </div>
            <div>Status: {cacheInfo.isStale ? '⚠️ Stale' : '✅ Fresh'}</div>
            {cacheInfo.cacheTimestamp && (
              <div>
                Last cached:{' '}
                <TimestampWithTooltip date={cacheInfo.cacheTimestamp} />
              </div>
            )}
          </div>

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
            <div>↻ Hard refresh current page</div>
            <div>🧹 Logout + clear all + restart SW</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCacheStatus;
