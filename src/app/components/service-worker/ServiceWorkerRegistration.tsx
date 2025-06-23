'use client';

import { useEffect } from 'react';
import { enforceOneServiceWorker } from '../../../lib/utils/service-worker-cleanup';

/* eslint-disable no-console */

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.groupCollapsed('🔧 Service Worker Registration');

          // Step 1: IMMEDIATE cleanup - enforce single service worker
          console.log('🧹 Enforcing single service worker...');
          await enforceOneServiceWorker();

          // Step 2: Clear all caches before registering new service worker
          console.log('🗑️ Clearing all caches...');
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(
                cacheNames.map(async (cacheName) => {
                  try {
                    await caches.delete(cacheName);
                    console.log(`✅ Deleted cache: ${cacheName}`);
                  } catch (e) {
                    console.warn(`⚠️ Failed to delete cache ${cacheName}:`, e);
                  }
                })
              );
            } catch (e) {
              console.warn('⚠️ Failed to clear caches:', e);
            }
          }

          // Step 3: Wait for the page to be fully loaded
          if (document.readyState !== 'complete') {
            await new Promise((resolve) => {
              window.addEventListener('load', resolve, { once: true });
            });
          }

          // Step 4: Final check before registration
          await enforceOneServiceWorker();

          // Step 5: Register new service worker with aggressive cache control
          console.log('📝 Registering new service worker...');
          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none' // Prevent caching of the service worker itself
            }
          );

          console.log(
            '✅ Service worker registration successful:',
            registration.scope
          );

          // Step 6: Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('🔄 New service worker found, installing...');

              newWorker.addEventListener('statechange', () => {
                console.log(`Service worker state: ${newWorker.state}`);

                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker is available, activate immediately
                    console.log(
                      '🚀 New service worker available, activating immediately...'
                    );
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else {
                    // First time installation
                    console.log(
                      '✅ Service worker installed for the first time'
                    );
                  }
                }

                if (newWorker.state === 'activated') {
                  console.log('✅ New service worker activated');
                  // Enforce single service worker after activation
                  setTimeout(() => enforceOneServiceWorker(), 1000);
                }
              });
            }
          });

          // Step 7: Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              console.log(
                `🔄 Service worker updated to version ${event.data.version}`
              );
              // Optionally show user notification about update
            }
          });

          // Step 8: Handle service worker controller changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('👑 Service worker controller changed');
            // Enforce single service worker on controller change
            setTimeout(() => enforceOneServiceWorker(), 500);
          });

          // Step 9: Aggressive periodic cleanup (every 5 minutes instead of 1 hour)
          const cleanupInterval = setInterval(
            async () => {
              await enforceOneServiceWorker();
            },
            5 * 60 * 1000
          ); // Every 5 minutes

          // Step 10: Cleanup on visibility change (when user returns to tab)
          const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
              console.log(
                '🔍 Tab visible: checking for multiple service workers...'
              );
              await enforceOneServiceWorker();
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Step 11: Cleanup on page focus (when user clicks on window)
          const handleFocus = async () => {
            console.log(
              '🔍 Page focused: checking for multiple service workers...'
            );
            await enforceOneServiceWorker();
          };

          window.addEventListener('focus', handleFocus);

          // Cleanup all listeners on component unmount
          return () => {
            clearInterval(cleanupInterval);
            document.removeEventListener(
              'visibilitychange',
              handleVisibilityChange
            );
            window.removeEventListener('focus', handleFocus);
          };
        } catch (err) {
          console.error('❌ Service worker registration failed:', err);
          console.groupEnd();
        }
      };

      // Start registration process immediately
      registerServiceWorker();

      // Also run immediate cleanup on component mount
      enforceOneServiceWorker();
    }
  }, []);

  return null;
}
