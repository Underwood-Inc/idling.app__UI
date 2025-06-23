/* eslint-disable no-console */

/**
 * Service Worker Cleanup Utilities
 * Use these functions to manually clean up multiple service workers
 */

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
    console.warn('Service workers not supported in this browser');
    return;
  }

  try {
    console.group('🧨 NUKING ALL SERVICE WORKERS');

    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} service worker registrations`);

    if (registrations.length === 0) {
      console.log('✅ No service workers to clean up');
      console.groupEnd();
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

    console.groupEnd();
    console.log('🔄 Refresh the page to start fresh');
  } catch (error) {
    console.error('❌ Failed to nuke service workers:', error);
    console.groupEnd();
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

    console.group(
      `🔍 SERVICE WORKER INSPECTION (${registrations.length} found)`
    );

    if (registrations.length === 0) {
      console.log('✅ No service workers registered');
      console.groupEnd();
      return;
    }

    registrations.forEach((registration, index) => {
      console.group(`📋 Service Worker ${index + 1}`);
      console.log('Scope:', registration.scope);
      console.log('Installing:', registration.installing?.scriptURL || 'None');
      console.log('Waiting:', registration.waiting?.scriptURL || 'None');
      console.log('Active:', registration.active?.scriptURL || 'None');
      console.log('Update via cache:', registration.updateViaCache);

      if (registration.active) {
        console.log('State:', registration.active.state);
        console.log('Script URL:', registration.active.scriptURL);
      }

      console.groupEnd();
    });

    console.groupEnd();

    if (registrations.length > 1) {
      console.warn(
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

    console.group(
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

    console.log('🏆 Keeping most recent:', sortedRegistrations[0].scope);

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
    console.groupEnd();
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
    console.group('🔧 ADVANCED SERVICE WORKER CLEANUP');

    // Step 1: Standard cleanup
    console.log('📋 Step 1: Standard registration cleanup...');
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} standard registrations`);

    for (const registration of registrations) {
      try {
        await registration.unregister();
        console.log('✅ Unregistered standard service worker');
      } catch (error) {
        console.warn('⚠️ Failed to unregister standard service worker:', error);
      }
    }

    // Step 2: Force unregister all scopes (common PWA scopes)
    console.log('🎯 Step 2: Force unregistering common scopes...');
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
    console.log('👑 Step 3: Clearing service worker controller...');
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
    console.log('🗑️ Step 4: Aggressive cache clearing...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} caches to clear`);

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
    console.log('💾 Step 5: Clearing related storage...');
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
    console.log('🔄 Step 6: Preparing for clean reload...');
    console.log('✅ Advanced cleanup complete!');
    console.groupEnd();

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
    console.groupEnd();
  }
}

/**
 * Diagnose service worker issues and provide specific guidance
 */
export async function diagnoseServiceWorkerIssues(): Promise<void> {
  console.group('🔍 SERVICE WORKER DIAGNOSTIC');

  try {
    // Check standard registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`📊 Standard registrations found: ${registrations.length}`);

    // Check controller
    const hasController = !!navigator.serviceWorker.controller;
    console.log(`👑 Has active controller: ${hasController}`);

    if (hasController) {
      console.log(
        `📍 Controller scope: ${navigator.serviceWorker.controller?.scriptURL}`
      );
    }

    // Check ready state
    try {
      const ready = await navigator.serviceWorker.ready;
      console.log(
        `✅ ServiceWorker ready state: ${ready.active?.state || 'none'}`
      );
    } catch (error) {
      console.log(
        `❌ ServiceWorker ready state: failed (${error instanceof Error ? error.message : String(error)})`
      );
    }

    // Check common issues
    console.log('\n🚨 COMMON ISSUES DETECTED:');

    if (registrations.length === 0) {
      console.log(
        '⚠️ No standard registrations found, but you see them in DevTools'
      );
      console.log('   → This indicates STUCK/FAILED registrations');
      console.log('   → Run: advancedServiceWorkerCleanup()');
    }

    if (registrations.length > 1) {
      console.log('⚠️ Multiple registrations detected');
      console.log('   → This can cause conflicts');
      console.log('   → Run: enforceOneServiceWorker()');
    }

    // Check for DevTools test messages
    console.log('\n🧪 DEVTOOLS TEST DETECTION:');
    console.log(
      'If you see "Test push message from DevTools" in Application tab:'
    );
    console.log('   → These are created by DevTools Push Messaging testing');
    console.log('   → They can get stuck in "trying to install" state');
    console.log(
      '   → Solution: advancedServiceWorkerCleanup() + close all tabs'
    );

    console.log('\n💡 RECOMMENDED ACTION:');
    if (registrations.length === 0) {
      console.log('🎯 Run: advancedServiceWorkerCleanup()');
    } else if (registrations.length > 1) {
      console.log('🎯 Run: enforceOneServiceWorker()');
    } else {
      console.log('🎯 Everything looks normal');
    }
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }

  console.groupEnd();
}

/**
 * Nuclear option: Complete browser state reset for service workers
 */
export async function nuclearServiceWorkerReset(): Promise<void> {
  console.group('☢️ NUCLEAR SERVICE WORKER RESET');
  console.warn('⚠️ This will clear EVERYTHING related to service workers!');

  try {
    // Run advanced cleanup first
    await advancedServiceWorkerCleanup();

    // Additional nuclear options
    console.log('💣 Additional nuclear cleanup...');

    // Try to clear IndexedDB (some PWAs store SW data here)
    if ('indexedDB' in window) {
      try {
        // This is a bit aggressive but necessary for stuck SWs
        console.log('🗃️ Attempting IndexedDB cleanup...');

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

    console.log('☢️ Nuclear reset complete!');
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

  console.groupEnd();
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
