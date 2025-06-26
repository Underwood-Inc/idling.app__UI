/**
 * Comprehensive Cache Management Utility
 *
 * Provides centralized control over service workers, browser caches,
 * and enforces the 12-hour maximum cache policy across the application.
 */

import { createLogger } from '@/lib/logging';

// Create logger for cache management
const logger = createLogger({
  context: {
    component: 'CacheManager',
    module: 'utils'
  },
  enabled: false
});

export interface CacheInfo {
  version: string;
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  maxCacheAge: number;
  ttls: Record<string, number>;
  timestamp: number;
  lastDailyRefresh: string | null;
  nextDailyRefresh: string;
}

export interface ServiceWorkerMessage {
  type: string;
  url?: string;
}

export interface ServiceWorkerResponse {
  success: boolean;
  timestamp?: number;
  version?: string;
  error?: string;
  cacheInfo?: CacheInfo;
}

/**
 * Maximum cache age - NOTHING can be cached longer than 12 hours
 */
export const MAX_CACHE_AGE = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Cache TTL configurations (all limited to MAX_CACHE_AGE)
 */
export const CACHE_TTLS = {
  static: Math.min(6 * 60 * 60 * 1000, MAX_CACHE_AGE), // 6 hours for static assets
  dynamic: Math.min(2 * 60 * 60 * 1000, MAX_CACHE_AGE), // 2 hours for dynamic content
  api: Math.min(30 * 60 * 1000, MAX_CACHE_AGE), // 30 minutes for API responses
  images: Math.min(4 * 60 * 60 * 1000, MAX_CACHE_AGE), // 4 hours for images
  pages: Math.min(1 * 60 * 60 * 1000, MAX_CACHE_AGE) // 1 hour for pages
};

/**
 * Send message to service worker and wait for response
 */
export async function sendServiceWorkerMessage(
  message: ServiceWorkerMessage
): Promise<ServiceWorkerResponse> {
  return new Promise((resolve, reject) => {
    if (
      !('serviceWorker' in navigator) ||
      !navigator.serviceWorker.controller
    ) {
      reject(new Error('Service worker not available'));
      return;
    }

    const messageChannel = new MessageChannel();
    const timeout = setTimeout(() => {
      reject(new Error('Service worker message timeout'));
    }, 10000); // 10 second timeout

    messageChannel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data);
    };

    try {
      navigator.serviceWorker.controller.postMessage(message, [
        messageChannel.port2
      ]);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * Get comprehensive cache information from service worker
 */
export async function getCacheInfo(): Promise<CacheInfo | null> {
  try {
    const response = await sendServiceWorkerMessage({ type: 'GET_CACHE_INFO' });
    return response.success ? response.cacheInfo || null : null;
  } catch (error) {
    logger.warn('Failed to get cache info', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Refresh cache for specific URL or all caches
 */
export async function refreshCache(url?: string): Promise<boolean> {
  try {
    const response = await sendServiceWorkerMessage({
      type: 'REFRESH_CACHE',
      url
    });
    return response.success;
  } catch (error) {
    logger.warn('Failed to refresh cache', {
      url,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Force cleanup of old service workers and caches
 */
export async function cleanupOldCaches(): Promise<boolean> {
  try {
    const response = await sendServiceWorkerMessage({
      type: 'CLEANUP_OLD_CACHES'
    });
    return response.success;
  } catch (error) {
    logger.warn('Failed to cleanup old caches', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Check if service worker is active and healthy
 */
export function isServiceWorkerActive(): boolean {
  return !!('serviceWorker' in navigator && navigator.serviceWorker.controller);
}

/**
 * Get all service worker registrations
 */
export async function getServiceWorkerRegistrations(): Promise<
  readonly ServiceWorkerRegistration[]
> {
  if (!('serviceWorker' in navigator)) {
    return [];
  }

  try {
    return await navigator.serviceWorker.getRegistrations();
  } catch (error) {
    logger.warn('Failed to get service worker registrations', {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

/**
 * Unregister all service workers except the most recent
 */
export async function cleanupServiceWorkers(): Promise<number> {
  const registrations = await getServiceWorkerRegistrations();

  if (registrations.length <= 1) {
    return 0; // Nothing to cleanup
  }

  // Sort by registration time (most recent first)
  const sortedRegistrations = [...registrations].sort((a, b) => {
    const aTime =
      a.installing?.scriptURL ||
      a.waiting?.scriptURL ||
      a.active?.scriptURL ||
      '';
    const bTime =
      b.installing?.scriptURL ||
      b.waiting?.scriptURL ||
      b.active?.scriptURL ||
      '';
    return bTime.localeCompare(aTime);
  });

  // Unregister all but the first (most recent)
  let cleanedCount = 0;
  const cleanupPromises = sortedRegistrations
    .slice(1)
    .map(async (registration) => {
      try {
        await registration.unregister();
        cleanedCount++;
        logger.debug('Cleaned up old service worker');
      } catch (error) {
        logger.warn('Failed to cleanup service worker', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

  await Promise.all(cleanupPromises);
  return cleanedCount;
}

/**
 * Clear route-scoped filters from localStorage
 */
export function clearRouteFilters(): void {
  try {
    // Import clearAllRouteFilters dynamically to avoid circular dependencies
    import('../state/atoms').then(({ clearAllRouteFilters }) => {
      clearAllRouteFilters();
    });
  } catch (error) {
    logger.warn('Failed to clear route filters', { error });
  }
}

/**
 * Clear all browser storage (localStorage, sessionStorage, IndexedDB, etc.)
 */
export async function clearAllBrowserStorage(): Promise<void> {
  // Clear localStorage
  try {
    localStorage.clear();
  } catch (error) {
    logger.warn('Failed to clear localStorage', { error });
  }

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (error) {
    logger.warn('Failed to clear sessionStorage', { error });
  }

  // Clear IndexedDB
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
    } catch (error) {
      logger.warn('Failed to clear IndexedDB', { error });
    }
  }

  // Clear WebSQL (deprecated but still present in some browsers)
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
    } catch (error) {
      logger.warn('Failed to clear WebSQL', { error });
    }
  }
}

/**
 * Clear all caches using Cache API
 */
export async function clearAllCaches(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(async (cacheName) => {
      try {
        await caches.delete(cacheName);
        logger.info('Deleted cache', { cacheName });
        return true;
      } catch (error) {
        logger.warn('Failed to delete cache', { cacheName, error });
        return false;
      }
    });

    const results = await Promise.all(deletePromises);
    return results.filter((success) => success).length;
  } catch (error) {
    logger.warn('Failed to clear caches', { error });
    return 0;
  }
}

/**
 * Comprehensive cache and storage cleanup
 */
export async function performCompleteCleanup(): Promise<{
  serviceWorkersCleanedUp: number;
  cachesCleared: number;
  storageCleared: boolean;
}> {
  logger.group('completeCleanup');

  // 1. Clear route-scoped filters first (before clearing all storage)
  logger.debug('Clearing route-scoped filters');
  clearRouteFilters();

  // 2. Clear all browser storage
  logger.debug('Clearing browser storage');
  await clearAllBrowserStorage();

  // 3. Clear all caches
  logger.debug('Clearing all caches');
  const cachesCleared = await clearAllCaches();

  // 4. Cleanup service workers
  logger.debug('Cleaning up service workers');
  const serviceWorkersCleanedUp = await cleanupServiceWorkers();

  // 5. Force service worker cache refresh
  logger.debug('Refreshing service worker cache');
  await refreshCache(); // No URL = clear all

  const result = {
    serviceWorkersCleanedUp,
    cachesCleared,
    storageCleared: true
  };

  logger.info('Complete cleanup finished', { result });
  logger.groupEnd();

  return result;
}

/**
 * Check if cache needs daily refresh (older than 24 hours)
 */
export function shouldPerformDailyRefresh(): boolean {
  try {
    const lastRefresh = localStorage.getItem('sw-daily-refresh');
    if (!lastRefresh) return true;

    const lastRefreshTime = parseInt(lastRefresh);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return now - lastRefreshTime > oneDayMs;
  } catch (error) {
    return true; // Default to refresh if we can't check
  }
}

/**
 * Mark daily refresh as completed
 */
export function markDailyRefreshCompleted(): void {
  try {
    localStorage.setItem('sw-daily-refresh', Date.now().toString());
  } catch (error) {
    logger.warn('Failed to mark daily refresh as completed', { error });
  }
}

/**
 * Get cache age in human-readable format
 */
export function formatCacheAge(timestamp: number): string {
  const now = Date.now();
  const age = now - timestamp;

  if (age < 60 * 1000) {
    return 'Just now';
  } else if (age < 60 * 60 * 1000) {
    return `${Math.floor(age / (60 * 1000))} minutes ago`;
  } else if (age < 24 * 60 * 60 * 1000) {
    return `${Math.floor(age / (60 * 60 * 1000))} hours ago`;
  } else {
    return `${Math.floor(age / (24 * 60 * 60 * 1000))} days ago`;
  }
}

/**
 * Check if cache is expired based on 12-hour limit
 */
export function isCacheExpired(timestamp: number): boolean {
  const age = Date.now() - timestamp;
  return age > MAX_CACHE_AGE;
}

/**
 * Register service worker with enhanced error handling and cleanup
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service workers not supported');
    return null;
  }

  try {
    logger.group('Service Worker Registration');

    // 1. Cleanup existing service workers first
    logger.info('Cleaning up existing service workers...');
    await cleanupServiceWorkers();

    // 2. Clear old caches
    logger.info('Clearing old caches...');
    await clearAllCaches();

    // 3. Register new service worker
    logger.info('Registering new service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    logger.info('Service worker registered successfully');
    logger.groupEnd();

    return registration;
  } catch (error) {
    logger.error('Service worker registration failed', error as Error);
    logger.groupEnd();
    return null;
  }
}
