/**
 * Hard Reset Manager
 *
 * Provides version-based and manual hard reset functionality to completely
 * clear all application data, making it appear as if the user is visiting
 * for the first time. This is agnostic and reusable for future deployments.
 */

import { createLogger } from '../logging';

// Create logger for hard reset management
const logger = createLogger({
  context: {
    module: 'hard-reset-manager'
  }
});

export interface HardResetConfig {
  // Version that triggers the reset
  resetVersion: string;
  // Whether to force reset regardless of version
  forceReset?: boolean;
  // Custom reset reason for logging
  resetReason?: string;
  // Whether to show user notification
  showNotification?: boolean;
}

export interface HardResetResult {
  wasResetNeeded: boolean;
  resetPerformed: boolean;
  previousVersion: string | null;
  currentVersion: string;
  itemsCleared: {
    serviceWorkers: number;
    caches: number;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    cookies: number;
    webSQL: boolean;
  };
  errors: string[];
}

/**
 * Storage keys for tracking reset state
 */
const RESET_STORAGE_KEYS = {
  LAST_RESET_VERSION: 'app-last-reset-version',
  LAST_RESET_TIMESTAMP: 'app-last-reset-timestamp',
  RESET_COUNT: 'app-reset-count',
  FIRST_VISIT: 'app-first-visit'
} as const;

/**
 * Get current app version from various sources
 */
function getCurrentAppVersion(): string {
  // Try to get version from meta tag (set during build)
  const metaVersion = document
    .querySelector('meta[name="app-version"]')
    ?.getAttribute('content');
  if (metaVersion) return metaVersion;

  // Try to get from global variable (set during build)
  const globalVersion = (window as any).__APP_VERSION__;
  if (globalVersion) return globalVersion;

  // Fallback to timestamp-based version
  return Date.now().toString();
}

/**
 * Get stored reset version from localStorage
 */
function getStoredResetVersion(): string | null {
  try {
    return localStorage.getItem(RESET_STORAGE_KEYS.LAST_RESET_VERSION);
  } catch (error) {
    logger.warn('Failed to get stored reset version:', { error });
    return null;
  }
}

/**
 * Store reset version and metadata
 */
function storeResetMetadata(version: string, resetCount: number): void {
  try {
    localStorage.setItem(RESET_STORAGE_KEYS.LAST_RESET_VERSION, version);
    localStorage.setItem(
      RESET_STORAGE_KEYS.LAST_RESET_TIMESTAMP,
      Date.now().toString()
    );
    localStorage.setItem(RESET_STORAGE_KEYS.RESET_COUNT, resetCount.toString());
  } catch (error) {
    logger.warn('Failed to store reset metadata:', { error });
  }
}

/**
 * Check if hard reset is needed based on version
 */
export function isHardResetNeeded(config: HardResetConfig): boolean {
  if (config.forceReset) {
    return true;
  }

  const currentVersion = getCurrentAppVersion();
  const storedVersion = getStoredResetVersion();

  // First visit - no reset needed, but mark as visited
  if (!storedVersion) {
    try {
      localStorage.setItem(
        RESET_STORAGE_KEYS.FIRST_VISIT,
        Date.now().toString()
      );
    } catch (error) {
      // Silent fail
    }
    return false;
  }

  // Check if reset version is different from stored version
  return storedVersion !== config.resetVersion;
}

/**
 * Clear all cookies
 */
async function clearAllCookies(): Promise<number> {
  let cookiesCleared = 0;

  try {
    // Clear document cookies
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      if (name) {
        // Clear for current domain and path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        cookiesCleared++;
      }
    }

    // Clear using Cookie Store API if available
    if ('cookieStore' in window) {
      try {
        const cookieStore = (window as any).cookieStore;
        const allCookies = await cookieStore.getAll();

        for (const cookie of allCookies) {
          await cookieStore.delete(cookie.name);
          cookiesCleared++;
        }
      } catch (error) {
        logger.warn('Failed to clear cookies via Cookie Store API:', { error });
      }
    }
  } catch (error) {
    logger.warn('Failed to clear cookies:', { error });
  }

  return cookiesCleared;
}

/**
 * Clear all localStorage (except reset tracking)
 */
async function clearLocalStorage(): Promise<boolean> {
  try {
    // Store reset metadata before clearing
    const resetVersion = localStorage.getItem(
      RESET_STORAGE_KEYS.LAST_RESET_VERSION
    );
    const resetTimestamp = localStorage.getItem(
      RESET_STORAGE_KEYS.LAST_RESET_TIMESTAMP
    );
    const resetCount = localStorage.getItem(RESET_STORAGE_KEYS.RESET_COUNT);
    const firstVisit = localStorage.getItem(RESET_STORAGE_KEYS.FIRST_VISIT);

    // Clear all localStorage
    localStorage.clear();

    // Restore reset tracking data
    if (resetVersion)
      localStorage.setItem(RESET_STORAGE_KEYS.LAST_RESET_VERSION, resetVersion);
    if (resetTimestamp)
      localStorage.setItem(
        RESET_STORAGE_KEYS.LAST_RESET_TIMESTAMP,
        resetTimestamp
      );
    if (resetCount)
      localStorage.setItem(RESET_STORAGE_KEYS.RESET_COUNT, resetCount);
    if (firstVisit)
      localStorage.setItem(RESET_STORAGE_KEYS.FIRST_VISIT, firstVisit);

    return true;
  } catch (error) {
    logger.warn('Failed to clear localStorage:', { error });
    return false;
  }
}

/**
 * Clear all sessionStorage
 */
async function clearSessionStorage(): Promise<boolean> {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    logger.warn('Failed to clear sessionStorage:', { error });
    return false;
  }
}

/**
 * Clear all IndexedDB databases
 */
async function clearIndexedDB(): Promise<boolean> {
  if (!('indexedDB' in window)) {
    return false;
  }

  try {
    const databases = await indexedDB.databases();

    await Promise.all(
      databases.map((db) => {
        if (db.name) {
          return new Promise<void>((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name!);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => reject(deleteReq.error);
            deleteReq.onblocked = () => {
              logger.warn(`IndexedDB deletion blocked for: ${db.name}`);
              resolve(); // Don't fail the entire process
            };
          });
        }
        return Promise.resolve();
      })
    );

    return true;
  } catch (error) {
    logger.warn('Failed to clear IndexedDB:', { error });
    return false;
  }
}

/**
 * Clear WebSQL (deprecated but still present in some browsers)
 */
async function clearWebSQL(): Promise<boolean> {
  try {
    if ('webkitStorageInfo' in window) {
      const webkitStorageInfo = (window as any).webkitStorageInfo;
      if (webkitStorageInfo && webkitStorageInfo.requestQuota) {
        return new Promise((resolve) => {
          webkitStorageInfo.requestQuota(
            0, // TEMPORARY
            0, // quota
            () => resolve(true),
            () => resolve(false)
          );
        });
      }
    }
    return false;
  } catch (error) {
    logger.warn('Failed to clear WebSQL:', { error });
    return false;
  }
}

/**
 * Clear all browser caches
 */
async function clearAllCaches(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();

    const deletePromises = cacheNames.map(async (cacheName) => {
      try {
        await caches.delete(cacheName);
        logger.info(`✅ Deleted cache: ${cacheName}`);
        return true;
      } catch (error) {
        logger.warn(`⚠️ Failed to delete cache ${cacheName}:`, { error });
        return false;
      }
    });

    const results = await Promise.all(deletePromises);
    return results.filter((success) => success).length;
  } catch (error) {
    logger.warn('Failed to clear caches:', { error });
    return 0;
  }
}

/**
 * Unregister ALL service workers
 */
async function unregisterAllServiceWorkers(): Promise<number> {
  if (!('serviceWorker' in navigator)) {
    return 0;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    const unregisterPromises = registrations.map(async (registration) => {
      try {
        await registration.unregister();
        logger.info('✅ Unregistered service worker');
        return true;
      } catch (error) {
        logger.warn('⚠️ Failed to unregister service worker:', { error });
        return false;
      }
    });

    const results = await Promise.all(unregisterPromises);
    return results.filter((success) => success).length;
  } catch (error) {
    logger.warn('Failed to unregister service workers:', { error });
    return 0;
  }
}

/**
 * Perform comprehensive hard reset
 */
export async function performHardReset(
  config: HardResetConfig
): Promise<HardResetResult> {
  const currentVersion = getCurrentAppVersion();
  const previousVersion = getStoredResetVersion();
  const errors: string[] = [];

  logger.group('hardReset');
  logger.info('Hard reset initiated', {
    resetVersion: config.resetVersion,
    currentVersion,
    previousVersion,
    forceReset: config.forceReset || false,
    reason: config.resetReason || 'Version change'
  });

  const result: HardResetResult = {
    wasResetNeeded: isHardResetNeeded(config),
    resetPerformed: false,
    previousVersion,
    currentVersion,
    itemsCleared: {
      serviceWorkers: 0,
      caches: 0,
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      cookies: 0,
      webSQL: false
    },
    errors
  };

  if (!result.wasResetNeeded && !config.forceReset) {
    logger.debug('No reset needed');
    logger.groupEnd();
    return result;
  }

  logger.debug('Starting comprehensive cleanup');

  try {
    // 1. Unregister all service workers
    logger.debug('Step 1: Unregistering service workers');
    try {
      result.itemsCleared.serviceWorkers = await unregisterAllServiceWorkers();
    } catch (error) {
      const errorMsg = `Service workers: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to unregister service workers', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 2. Clear all caches
    logger.debug('Step 2: Clearing caches');
    try {
      result.itemsCleared.caches = await clearAllCaches();
    } catch (error) {
      const errorMsg = `Caches: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to clear caches', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 3. Clear localStorage (preserving reset tracking)
    logger.debug('Step 3: Clearing localStorage');
    try {
      result.itemsCleared.localStorage = await clearLocalStorage();
    } catch (error) {
      const errorMsg = `localStorage: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to clear localStorage', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 4. Clear sessionStorage
    logger.debug('Step 4: Clearing sessionStorage');
    try {
      result.itemsCleared.sessionStorage = await clearSessionStorage();
    } catch (error) {
      const errorMsg = `sessionStorage: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to clear sessionStorage', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 5. Clear IndexedDB
    logger.debug('Step 5: Clearing IndexedDB');
    try {
      result.itemsCleared.indexedDB = await clearIndexedDB();
    } catch (error) {
      const errorMsg = `IndexedDB: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to clear IndexedDB', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 6. Clear cookies
    logger.debug('Step 6: Clearing cookies');
    try {
      result.itemsCleared.cookies = await clearAllCookies();
    } catch (error) {
      const errorMsg = `Cookies: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to clear cookies', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 7. Clear WebSQL
    logger.debug('Step 7: Clearing WebSQL');
    try {
      result.itemsCleared.webSQL = await clearWebSQL();
    } catch (error) {
      const errorMsg = `WebSQL: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to clear WebSQL', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 8. Update reset tracking
    logger.debug('Step 8: Updating reset tracking');
    try {
      const currentResetCount = parseInt(
        localStorage.getItem(RESET_STORAGE_KEYS.RESET_COUNT) || '0'
      );
      storeResetMetadata(config.resetVersion, currentResetCount + 1);
    } catch (error) {
      const errorMsg = `Reset tracking: ${error}`;
      errors.push(errorMsg);
      logger.warn('Failed to update reset tracking', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    result.resetPerformed = true;

    logger.info('Hard reset completed successfully', {
      itemsCleared: result.itemsCleared
    });

    if (errors.length > 0) {
      logger.warn('Some errors occurred during reset', { errors });
    }
  } catch (error) {
    logger.error('Hard reset failed', error as Error);
    errors.push(`General: ${error}`);
  }

  logger.groupEnd();

  return result;
}

/**
 * Check and perform hard reset if needed (main entry point)
 */
export async function checkAndPerformHardReset(
  config: HardResetConfig
): Promise<HardResetResult> {
  const result = await performHardReset(config);

  // If reset was performed, show notification if requested
  if (result.resetPerformed && config.showNotification) {
    try {
      // Create a simple notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
      `;
      notification.innerHTML = `
        <strong>App Updated!</strong><br>
        ${config.resetReason || 'Your app has been refreshed with the latest version.'}
      `;

      document.body.appendChild(notification);

      // Remove notification after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    } catch (error) {
      logger.warn('Failed to show reset notification:', { error });
    }
  }

  return result;
}

/**
 * Get reset statistics
 */
export function getResetStats(): {
  lastResetVersion: string | null;
  lastResetTimestamp: number | null;
  resetCount: number;
  firstVisit: number | null;
} {
  try {
    return {
      lastResetVersion: localStorage.getItem(
        RESET_STORAGE_KEYS.LAST_RESET_VERSION
      ),
      lastResetTimestamp:
        parseInt(
          localStorage.getItem(RESET_STORAGE_KEYS.LAST_RESET_TIMESTAMP) || '0'
        ) || null,
      resetCount: parseInt(
        localStorage.getItem(RESET_STORAGE_KEYS.RESET_COUNT) || '0'
      ),
      firstVisit:
        parseInt(localStorage.getItem(RESET_STORAGE_KEYS.FIRST_VISIT) || '0') ||
        null
    };
  } catch (error) {
    return {
      lastResetVersion: null,
      lastResetTimestamp: null,
      resetCount: 0,
      firstVisit: null
    };
  }
}

/**
 * Manual hard reset trigger (for admin/debug purposes)
 */
export async function triggerManualHardReset(
  reason: string = 'Manual reset'
): Promise<HardResetResult> {
  return await performHardReset({
    resetVersion: Date.now().toString(),
    forceReset: true,
    resetReason: reason,
    showNotification: true
  });
}
