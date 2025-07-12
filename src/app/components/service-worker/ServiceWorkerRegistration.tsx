'use client';

import { createLogger } from '@lib/logging';
import { useEffect } from 'react';
import { enforceOneServiceWorker } from '../../../lib/utils/service-worker-cleanup';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'ServiceWorkerRegistration',
    module: 'components/service-worker'
  },
  enabled: false
});

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          logger.group('serviceWorkerRegistration');

          // Step 1: IMMEDIATE cleanup - enforce single service worker
          logger.debug('Enforcing single service worker');
          await enforceOneServiceWorker();

          // Step 2: Clear all caches before registering new service worker
          logger.debug('Clearing all caches');
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(
                cacheNames.map(async (cacheName) => {
                  try {
                    await caches.delete(cacheName);
                    logger.debug('Cache deleted successfully', { cacheName });
                  } catch (e) {
                    logger.warn('Failed to delete cache', {
                      cacheName,
                      errorMessage: e instanceof Error ? e.message : String(e)
                    });
                  }
                })
              );
            } catch (e) {
              logger.warn('Failed to clear caches', {
                errorMessage: e instanceof Error ? e.message : String(e)
              });
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
          logger.debug('Registering new service worker');
          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none' // Prevent caching of the service worker itself
            }
          );

          logger.info('Service worker registration successful', {
            scope: registration.scope
          });

          // Step 6: Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              logger.debug('New service worker found, installing');

              newWorker.addEventListener('statechange', () => {
                logger.debug('Service worker state changed', {
                  state: newWorker.state
                });

                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker is available, activate immediately
                    logger.debug(
                      'New service worker available, activating immediately'
                    );
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else {
                    // First time installation
                    logger.debug('Service worker installed for the first time');
                  }
                }

                if (newWorker.state === 'activated') {
                  logger.debug('New service worker activated');
                  // Enforce single service worker after activation
                  setTimeout(() => enforceOneServiceWorker(), 1000);
                }
              });
            }
          });

          // Step 7: Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              logger.debug('Service worker updated', {
                version: event.data.version
              });
              // Optionally show user notification about update
            }
          });

          // Step 8: Handle service worker controller changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            logger.debug('Service worker controller changed');
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
              logger.debug(
                'Tab visible: checking for multiple service workers'
              );
              await enforceOneServiceWorker();
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Step 11: Cleanup on page focus (when user clicks on window)
          const handleFocus = async () => {
            logger.debug('Page focused: checking for multiple service workers');
            await enforceOneServiceWorker();
          };

          window.addEventListener('focus', handleFocus);

          // Close the logger group before returning cleanup function
          logger.groupEnd();

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
          logger.error('Service worker registration failed', err as Error);
          // Close the logger group in error case too
          logger.groupEnd();
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
