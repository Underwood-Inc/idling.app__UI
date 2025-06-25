/* eslint-disable no-console */
/**
 * Service Worker Cleanup Utilities
 * Use these functions to manually clean up multiple service workers
 */

import { createLogger } from '@/lib/logging';

// Create logger for service worker cleanup
const logger = createLogger({
  context: {
    component: 'ServiceWorkerCleanup',
    module: 'utils'
  }
});

/**
 * Display available console functions in big text
 */
function displayAvailableFunctions(): void {
  console.log(`
█████████████████████████████████████████████████████████████████████████████
██                                                                         ██
██   ███████ ███████ ██████  ██    ██ ██  ██████ ███████                   ██
██   ██      ██      ██   ██ ██    ██ ██ ██      ██                        ██
██   ███████ █████   ██████  ██    ██ ██ ██      █████                     ██
██        ██ ██      ██   ██  ██  ██  ██ ██      ██                        ██
██   ███████ ███████ ██   ██   ████   ██  ██████ ███████                   ██
██                                                                         ██
██   ██     ██  ██████  ██████  ██   ██ ███████ ██████                     ██
██   ██     ██ ██    ██ ██   ██ ██  ██  ██      ██   ██                    ██
██   ██  █  ██ ██    ██ ██████  █████   █████   ██████                     ██
██   ██ ███ ██ ██    ██ ██   ██ ██  ██  ██      ██   ██                    ██
██    ███ ███   ██████  ██   ██ ██   ██ ███████ ██   ██                    ██
██                                                                         ██
██                    ██████ ██      ███████  █████  ███    ██             ██
██                   ██      ██      ██      ██   ██ ████   ██             ██
██                   ██      ██      █████   ███████ ██ ██  ██             ██
██                   ██      ██      ██      ██   ██ ██  ██ ██             ██
██                    ██████ ███████ ███████ ██   ██ ██   ████             ██
██                                                                         ██
█████████████████████████████████████████████████████████████████████████████

🚀 SERVICE WORKER CLEANUP UTILITIES LOADED!

Available functions in your browser console:

┌─────────────────────────────────────────────────────────────────────────────┐
│                            📋 DIAGNOSTIC TOOLS                             │
│                                                                             │
│  🔍 diagnoseServiceWorkerIssues()                                           │
│     ↳ Analyze current SW state & get personalized recommendations          │
│     ↳ START HERE: Shows what's wrong and what to run                       │
│                                                                             │
│  📊 inspectServiceWorkers()                                                 │
│     ↳ Shows detailed info about all registered service workers             │
│     ↳ Use this to see what's currently registered                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                            🧹 CLEANUP TOOLS                                │
│                                                                             │
│  🔧 advancedServiceWorkerCleanup()  ⭐ RECOMMENDED FOR STUCK SWs            │
│     ↳ Handles stuck/failed registrations visible in DevTools               │
│     ↳ Perfect for "trying to install" and DevTools test messages           │
│                                                                             │
│  🎯 enforceOneServiceWorker()                                               │
│     ↳ Keeps only the most recent service worker, removes the rest          │
│     ↳ Use this for gentle cleanup (keeps one working SW)                   │
│                                                                             │
│  🧨 nukeAllServiceWorkers()                                                 │
│     ↳ NUCLEAR: Removes ALL service workers + clears all caches             │
│     ↳ Use when you have too many standard registrations                    │
│                                                                             │
│  ☢️  nuclearServiceWorkerReset()                                            │
│     ↳ ULTIMATE NUCLEAR: Complete browser state reset                       │
│     ↳ Last resort when everything else fails                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

🚨 FOR YOUR ISSUE (stuck "trying to install" service workers):
   1. diagnoseServiceWorkerIssues()     (confirm the problem)
   2. advancedServiceWorkerCleanup()    (fix stuck registrations)
   3. Close ALL tabs and reopen browser (essential!)

💡 GENERAL WORKFLOW:
   1. Run: diagnoseServiceWorkerIssues()  (get personalized advice)
   2. Follow the recommendation it gives you
   3. Close all tabs and reopen browser

`);
}

/**
 * Immediately unregister ALL service workers for the current domain
 * Use this when you have too many service workers accumulating
 */
export async function nukeAllServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service workers not supported in this browser');
    return;
  }

  try {
    logger.group('🧨 NUKING ALL SERVICE WORKERS');

    const registrations = await navigator.serviceWorker.getRegistrations();
    logger.info('Found service worker registrations', {
      count: registrations.length
    });

    if (registrations.length === 0) {
      console.log('✅ No service workers to clean up');
      logger.groupEnd();
      return;
    }

    // Unregister ALL service workers
    const unregisterPromises = registrations.map(
      async (registration, index) => {
        try {
          await registration.unregister();
          console.log(
            `✅ Unregistered service worker ${index + 1}/${registrations.length}`
          );
          return true;
        } catch (error) {
          console.error(
            `❌ Failed to unregister service worker ${index + 1}:`,
            error
          );
          return false;
        }
      }
    );

    const results = await Promise.all(unregisterPromises);
    const successCount = results.filter((success) => success).length;

    console.log(
      `🎯 Cleanup complete: ${successCount}/${registrations.length} service workers removed`
    );

    // Clear all caches too
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      if (cacheNames.length > 0) {
        console.log(`🗑️ Clearing ${cacheNames.length} caches...`);
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
        console.log('✅ All caches cleared');
      }
    }

    logger.groupEnd();
    console.log('🔄 Refresh the page to start fresh');
  } catch (error) {
    console.error('❌ Failed to nuke service workers:', error);
    logger.groupEnd();
  }
}

/**
 * Get detailed information about all service workers
 */
export async function inspectServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    logger.group(
      `🔍 SERVICE WORKER INSPECTION (${registrations.length} found)`
    );

    if (registrations.length === 0) {
      console.log('✅ No service workers registered');
      logger.groupEnd();
      return;
    }

    registrations.forEach((registration, index) => {
      logger.group(`📋 Service Worker ${index + 1}`);
      logger.info('Scope', { scope: registration.scope });
      logger.info('Installing', {
        scriptURL: registration.installing?.scriptURL || 'None'
      });
      logger.info('Waiting', {
        scriptURL: registration.waiting?.scriptURL || 'None'
      });
      logger.info('Active', {
        scriptURL: registration.active?.scriptURL || 'None'
      });
      logger.info('Update via cache', {
        updateViaCache: registration.updateViaCache
      });

      if (registration.active) {
        logger.info('State', { state: registration.active.state });
        logger.info('Script URL', { scriptURL: registration.active.scriptURL });
      }

      logger.groupEnd();
    });

    logger.groupEnd();

    if (registrations.length > 1) {
      logger.warn(
        `⚠️ Multiple service workers detected! Run nukeAllServiceWorkers() to clean up.`
      );
    }
  } catch (error) {
    console.error('❌ Failed to inspect service workers:', error);
  }
}

/**
 * Enforce exactly one service worker (keep the most recent)
 */
export async function enforceOneServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    if (registrations.length <= 1) {
      console.log('✅ Single service worker enforcement: OK');
      return;
    }

    logger.group(
      `🎯 ENFORCING SINGLE SERVICE WORKER (${registrations.length} found)`
    );

    // Sort by most recent (by script URL timestamp)
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

    logger.info('🏆 Keeping most recent:', {
      scope: sortedRegistrations[0].scope
    });

    // Unregister all but the first (most recent)
    const cleanupPromises = sortedRegistrations
      .slice(1)
      .map(async (registration, index) => {
        try {
          await registration.unregister();
          console.log(`✅ Removed old service worker ${index + 1}`);
          return true;
        } catch (error) {
          console.error(
            `❌ Failed to remove service worker ${index + 1}:`,
            error
          );
          return false;
        }
      });

    const results = await Promise.all(cleanupPromises);
    const cleanedCount = results.filter((success) => success).length;

    console.log(`🎯 Enforcement complete: kept 1, removed ${cleanedCount}`);
    logger.groupEnd();
  } catch (error) {
    console.error('❌ Failed to enforce single service worker:', error);
  }
}

/**
 * Advanced service worker cleanup that handles stuck/failed registrations
 * These are often not detected by getRegistrations() but visible in DevTools
 */
export async function advancedServiceWorkerCleanup(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return;
  }

  try {
    logger.group('🔧 ADVANCED SERVICE WORKER CLEANUP');

    // Step 1: Standard cleanup
    logger.info('📋 Step 1: Standard registration cleanup...');
    const registrations = await navigator.serviceWorker.getRegistrations();
    logger.info('Found standard registrations', {
      count: registrations.length
    });

    for (const registration of registrations) {
      try {
        await registration.unregister();
        console.log('✅ Unregistered standard service worker');
      } catch (error) {
        console.warn('⚠️ Failed to unregister standard service worker:', error);
      }
    }

    // Step 2: Force unregister all scopes (common PWA scopes)
    logger.info('🎯 Step 2: Force unregistering common scopes...');
    const commonScopes = [
      '/',
      '/sw.js',
      '/service-worker.js',
      '/pwa-sw.js',
      '/workbox-sw.js',
      '/firebase-messaging-sw.js',
      window.location.origin + '/',
      window.location.origin + '/sw.js',
      window.location.origin + '/service-worker.js'
    ];

    for (const scope of commonScopes) {
      try {
        const registration =
          await navigator.serviceWorker.getRegistration(scope);
        if (registration) {
          await registration.unregister();
          console.log(`✅ Force unregistered scope: ${scope}`);
        }
      } catch (error) {
        // Silently continue - scope might not exist
      }
    }

    // Step 3: Clear service worker controller
    logger.info('👑 Step 3: Clearing service worker controller...');
    if (navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'SKIP_WAITING'
        });
        console.log('✅ Sent SKIP_WAITING to controller');
      } catch (error) {
        console.warn('⚠️ Failed to message controller:', error);
      }
    }

    // Step 4: Clear all caches aggressively
    logger.info('🗑️ Step 4: Aggressive cache clearing...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      logger.info('Found caches to clear', { count: cacheNames.length });

      for (const cacheName of cacheNames) {
        try {
          await caches.delete(cacheName);
          console.log(`✅ Deleted cache: ${cacheName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete cache ${cacheName}:`, error);
        }
      }
    }

    // Step 5: Clear storage that might be holding SW references
    logger.info('💾 Step 5: Clearing related storage...');
    try {
      // Clear localStorage items that might reference service workers
      const swKeys = Object.keys(localStorage).filter(
        (key) =>
          key.includes('sw-') ||
          key.includes('service-worker') ||
          key.includes('workbox') ||
          key.includes('pwa')
      );

      swKeys.forEach((key) => {
        localStorage.removeItem(key);
        console.log(`✅ Cleared localStorage: ${key}`);
      });

      // Clear sessionStorage
      const sessionSwKeys = Object.keys(sessionStorage).filter(
        (key) =>
          key.includes('sw-') ||
          key.includes('service-worker') ||
          key.includes('workbox') ||
          key.includes('pwa')
      );

      sessionSwKeys.forEach((key) => {
        sessionStorage.removeItem(key);
        console.log(`✅ Cleared sessionStorage: ${key}`);
      });
    } catch (error) {
      console.warn('⚠️ Failed to clear some storage:', error);
    }

    // Step 6: Force reload to ensure clean state
    logger.info('🔄 Step 6: Preparing for clean reload...');
    console.log('✅ Advanced cleanup complete!');
    logger.groupEnd();

    console.log(`
🎯 ADVANCED CLEANUP COMPLETE!

What was cleaned:
✅ Standard service worker registrations
✅ Common PWA scope registrations  
✅ Service worker controller messages
✅ All browser caches
✅ Service worker related localStorage
✅ Service worker related sessionStorage

🔄 NEXT STEPS:
1. Close ALL browser tabs for this domain
2. Reopen the browser completely
3. Navigate back to the site
4. Check DevTools → Application → Service Workers

This should remove the stuck "trying to install" registrations.
    `);
  } catch (error) {
    console.error('❌ Advanced cleanup failed:', error);
    logger.groupEnd();
  }
}

/**
 * Diagnose service worker issues and provide specific guidance
 */
export async function diagnoseServiceWorkerIssues(): Promise<void> {
  logger.group('🔍 SERVICE WORKER DIAGNOSTIC');

  try {
    // Check standard registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    logger.info('Found standard registrations', {
      count: registrations.length
    });

    // Check controller
    const hasController = !!navigator.serviceWorker.controller;
    logger.info('Has active controller', { hasController });

    if (hasController) {
      logger.info('Controller scope', {
        scriptURL: navigator.serviceWorker.controller?.scriptURL
      });
    }

    // Check ready state
    try {
      const ready = await navigator.serviceWorker.ready;
      logger.info('ServiceWorker ready state', {
        state: ready.active?.state || 'none'
      });
    } catch (error) {
      logger.info('ServiceWorker ready state', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Check common issues
    logger.info('\n🚨 COMMON ISSUES DETECTED:');

    if (registrations.length === 0) {
      logger.info(
        '⚠️ No standard registrations found, but you see them in DevTools'
      );
      logger.info('   → This indicates STUCK/FAILED registrations');
      logger.info('   → Run: advancedServiceWorkerCleanup()');
    }

    if (registrations.length > 1) {
      logger.info('⚠️ Multiple registrations detected');
      logger.info('   → This can cause conflicts');
      logger.info('   → Run: enforceOneServiceWorker()');
    }

    // Check for DevTools test messages
    logger.info('\n🧪 DEVTOOLS TEST DETECTION:');
    logger.info(
      'If you see "Test push message from DevTools" in Application tab:'
    );
    logger.info('   → These are created by DevTools Push Messaging testing');
    logger.info('   → They can get stuck in "trying to install" state');
    logger.info(
      '   → Solution: advancedServiceWorkerCleanup() + close all tabs'
    );

    logger.info('\n💡 RECOMMENDED ACTION:');
    if (registrations.length === 0) {
      logger.info('🎯 Run: advancedServiceWorkerCleanup()');
    } else if (registrations.length > 1) {
      logger.info('🎯 Run: enforceOneServiceWorker()');
    } else {
      logger.info('🎯 Everything looks normal');
    }
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }

  logger.groupEnd();
}

/**
 * Nuclear option: Complete browser state reset for service workers
 */
export async function nuclearServiceWorkerReset(): Promise<void> {
  logger.group('☢️ NUCLEAR SERVICE WORKER RESET');
  logger.warn('⚠️ This will clear EVERYTHING related to service workers!');

  try {
    // Run advanced cleanup first
    await advancedServiceWorkerCleanup();

    // Additional nuclear options
    logger.info('💣 Additional nuclear cleanup...');

    // Try to clear IndexedDB (some PWAs store SW data here)
    if ('indexedDB' in window) {
      try {
        // This is a bit aggressive but necessary for stuck SWs
        logger.info('🗃️ Attempting IndexedDB cleanup...');

        // Get all databases (this is experimental)
        if ('databases' in indexedDB) {
          const databases = await (indexedDB as any).databases();
          for (const db of databases) {
            try {
              indexedDB.deleteDatabase(db.name);
              console.log(`✅ Deleted IndexedDB: ${db.name}`);
            } catch (error) {
              console.warn(`⚠️ Failed to delete IndexedDB ${db.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ IndexedDB cleanup failed:', error);
      }
    }

    logger.info('☢️ Nuclear reset complete!');
    console.log(`
🎯 NUCLEAR RESET COMPLETE!

CRITICAL NEXT STEPS:
1. 🚪 Close ALL browser tabs for this domain
2. 🔄 Close and reopen your entire browser
3. 🧹 Optional: Clear browser data for this site:
   - Go to DevTools → Application → Storage
   - Click "Clear site data"
4. 🌐 Navigate back to the site fresh

This should eliminate ALL stuck service worker registrations.
    `);
  } catch (error) {
    console.error('❌ Nuclear reset failed:', error);
  }

  logger.groupEnd();
}

export function displayServiceWorkerNukeInstructions() {
  // Keep console display functions intentionally for debugging tools
  // eslint-disable-next-line no-console
  console.log(`
🧨 NUCLEAR SERVICE WORKER CLEANUP 🧨
=====================================

This will COMPLETELY destroy all service workers and caches.
Use this when the normal cleanup isn't working.

To execute the nuclear option, run:
nukeAllServiceWorkers()

WARNING: This will:
- Unregister ALL service workers on this domain
- Delete ALL caches
- Force refresh the page
- May cause temporary loading issues

Only use if normal cache refresh isn't working!
`);
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).nukeAllServiceWorkers = nukeAllServiceWorkers;
  (window as any).inspectServiceWorkers = inspectServiceWorkers;
  (window as any).enforceOneServiceWorker = enforceOneServiceWorker;
  (window as any).advancedServiceWorkerCleanup = advancedServiceWorkerCleanup;
  (window as any).diagnoseServiceWorkerIssues = diagnoseServiceWorkerIssues;
  (window as any).nuclearServiceWorkerReset = nuclearServiceWorkerReset;
  (window as any).showServiceWorkerHelp = displayAvailableFunctions;

  // Automatically display the help when the utilities are loaded
  setTimeout(() => {
    displayAvailableFunctions();
  }, 2000); // Delay to ensure console is ready
}
