'use client';

import { signOut } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';
import './CacheStatus.css';

interface CacheInfo {
  isCached: boolean;
  cacheTimestamp?: Date;
  cacheAge?: string;
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

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

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

  const checkCacheStatus = useCallback(async () => {
    try {
      // Check if service worker is available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const hasServiceWorker = !!registration;

        // Check cache storage
        let cacheSize = 0;
        let cacheCount = 0;
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            cacheCount = cacheNames.length;

            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              cacheSize += requests.length;
            }
          } catch (e) {
            // Silent error handling
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
          // Silent error handling
        }

        const newCacheInfo = {
          isCached: hasServiceWorker || cacheCount > 0 || localStorageSize > 0,
          cacheTimestamp: new Date(),
          details: {
            serviceWorker: hasServiceWorker,
            cacheCount,
            cacheSize,
            localStorageSize: Math.round(localStorageSize / 1024) // KB
          }
        };

        setCacheInfo(newCacheInfo);
      }
    } catch (error) {
      // Silent error handling
    }
  }, []);

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
    setIsClearing(true);
    try {
      // 1. Sign out from NextAuth
      await signOut({ redirect: false });

      // 2. Clear all storage
      try {
        localStorage.clear();
      } catch (e) {
        // Silent error handling
      }

      try {
        sessionStorage.clear();
      } catch (e) {
        // Silent error handling
      }

      // 3. Clear cookies
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // 4. Clear IndexedDB
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map((db) => {
              if (db.name) {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                return new Promise((resolve, reject) => {
                  deleteReq.onsuccess = () => resolve(undefined);
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

      // 5. Unregister service worker
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

      // 7. Re-register service worker
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          // Silent error handling
        }
      }

      // 8. Force page reload to complete the reset
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
