'use client';

import { signOut } from 'next-auth/react';
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
  const [isClearingAll, setIsClearingAll] = useState(false);
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

  /**
   * Refresh current page cache - equivalent to "Empty cache and hard refresh"
   */
  const refreshPageCache = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    console.log('🔄 Performing hard refresh (empty cache and reload)...');

    try {
      // Clear cache for current page
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          await cache.delete(window.location.href);
          await cache.delete(window.location.pathname);
          console.log(`🗑️ Cleared current page from cache: ${cacheName}`);
        }
      }

      // Clear service worker cache for current page
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
            url: window.location.href
          },
          [messageChannel.port2]
        );

        await refreshPromise;
      }

      console.log('✅ Page cache cleared, performing hard refresh...');

      // Perform hard refresh with cache bypass
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to refresh page cache:', error);
      // Fallback: force hard reload anyway
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Clear all cache - logout user, unregister service workers, clear all caches, and re-register
   */
  const clearAllCache = async () => {
    if (isClearingAll) return;

    setIsClearingAll(true);
    console.log(
      '🧹 Clearing ALL site data, logging out user, and restarting service workers...'
    );

    try {
      // Step 1: Logout user properly (server + client + JWT + cookies)
      console.log('🚪 Logging out user...');
      try {
        await signOut({
          redirect: false, // Don't redirect, we'll handle the refresh manually
          callbackUrl: '/' // Set callback URL for after refresh
        });
        console.log('✅ User logged out from NextAuth');
      } catch (error) {
        console.warn(
          '⚠️ NextAuth logout failed, continuing with cache clear:',
          error
        );
      }

      // Step 2: Get storage estimate before clearing (for logging)
      let storageBeforeClear = null;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          storageBeforeClear = await navigator.storage.estimate();
          console.log(
            `📊 Storage before clear: ${Math.round(((storageBeforeClear.usage || 0) / 1024 / 1024) * 100) / 100}MB used of ${Math.round(((storageBeforeClear.quota || 0) / 1024 / 1024) * 100) / 100}MB available`
          );
        } catch (e) {
          console.log('ℹ️ Could not get storage estimate');
        }
      }

      // Step 3: Clear site data using modern Storage API (if available)
      if ('storage' in navigator && 'persist' in navigator.storage) {
        try {
          // Request persistent storage (helps with clearing)
          await navigator.storage.persist();
          console.log('✅ Storage persistence requested');
        } catch (e) {
          console.log('ℹ️ Storage persistence not available');
        }
      }

      // Step 4: Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('✅ Service worker unregistered');
        }
      }

      // Step 5: Clear all cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`🗑️ Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        console.log('✅ All cache storage cleared');
      }

      // Step 6: Clear ALL application storage (including auth data)
      console.log('🗑️ Clearing ALL application storage...');

      // Clear localStorage completely (including auth tokens)
      localStorage.clear();
      console.log('✅ localStorage cleared completely');

      // Clear sessionStorage completely
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');

      // Step 7: Clear all cookies (auth-related and others)
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Clear cookie for current domain and all possible paths
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
        console.log('✅ All cookies cleared');
      }

      // Step 8: Clear IndexedDB completely
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map((db) => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => {
                    console.log(`✅ IndexedDB ${db.name} cleared`);
                    resolve(undefined);
                  };
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
        } catch (e) {
          console.log(
            'ℹ️ IndexedDB clearing not supported or no databases found'
          );
        }
      }

      // Step 9: Clear WebSQL (if supported - deprecated but still present in some browsers)
      if ('webkitStorageInfo' in window) {
        try {
          // @ts-ignore - WebSQL is deprecated but may still exist
          const webkitStorageInfo = (window as any).webkitStorageInfo;
          if (webkitStorageInfo && webkitStorageInfo.requestQuota) {
            console.log('🗑️ Attempting to clear WebSQL...');
            webkitStorageInfo.requestQuota(
              0,
              0,
              () => {
                console.log('✅ WebSQL cleared');
              },
              () => {
                console.log('ℹ️ WebSQL clearing failed or not supported');
              }
            );
          }
        } catch (e) {
          console.log('ℹ️ WebSQL not available');
        }
      }

      // Step 10: Clear Application Cache (if supported - deprecated but still present)
      if ('applicationCache' in window && window.applicationCache) {
        try {
          (window.applicationCache as any).update();
          console.log('✅ Application cache updated');
        } catch (e) {
          console.log('ℹ️ Application cache not available');
        }
      }

      console.log(
        '🎉 All site data and user session cleared! Re-registering service worker...'
      );

      // Step 11: Re-register service worker with better error handling
      if ('serviceWorker' in navigator) {
        try {
          // Clear any existing service worker controller
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SKIP_WAITING'
            });
          }

          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none' // Ensure fresh service worker
            }
          );
          console.log('✅ Service worker re-registered:', registration.scope);

          // Wait for the new service worker to be ready
          await new Promise((resolve) => {
            if (registration.active) {
              resolve(undefined);
            } else {
              registration.addEventListener('statechange', () => {
                if (registration.active) {
                  resolve(undefined);
                }
              });
            }
          });
        } catch (error) {
          console.warn('⚠️ Failed to re-register service worker:', error);
          console.log(
            'ℹ️ This may be due to redirect issues - will continue with refresh'
          );
        }
      }

      // Step 12: Get storage estimate after clearing (for verification)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const storageAfterClear = await navigator.storage.estimate();
          console.log(
            `📊 Storage after clear: ${Math.round(((storageAfterClear.usage || 0) / 1024 / 1024) * 100) / 100}MB used of ${Math.round(((storageAfterClear.quota || 0) / 1024 / 1024) * 100) / 100}MB available`
          );

          if (
            storageBeforeClear &&
            storageAfterClear.usage !== undefined &&
            storageBeforeClear.usage !== undefined
          ) {
            const clearedMB =
              Math.round(
                ((storageBeforeClear.usage - storageAfterClear.usage) /
                  1024 /
                  1024) *
                  100
              ) / 100;
            console.log(`🗑️ Successfully cleared ${clearedMB}MB of site data`);
          }
        } catch (e) {
          console.log('ℹ️ Could not verify storage clearing');
        }
      }

      // Step 13: Perform hard refresh to complete logout and restart
      setTimeout(() => {
        console.log(
          '🔄 Performing final hard refresh with complete session reset...'
        );
        // Use replace to avoid back button issues and ensure clean state
        window.location.replace('/');
      }, 1000);
    } catch (error) {
      console.error(
        '❌ Error during complete site data and session clear:',
        error
      );
      // Fallback: force hard refresh to home page anyway
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
    } finally {
      setIsClearingAll(false);
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
        onClick={refreshPageCache}
        disabled={isRefreshing || isClearingAll}
        title="Refresh current page cache (hard refresh)"
        aria-label="Empty cache and hard refresh current page"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>

      <button
        className="cache-status__refresh"
        onClick={clearAllCache}
        disabled={isRefreshing || isClearingAll}
        title="Logout user, clear all site data (cache, storage, cookies), and restart service workers"
        aria-label="Complete logout and clear all site data"
        style={{ marginLeft: '4px' }}
      >
        {isClearingAll ? '⟳' : '🧹'}
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
