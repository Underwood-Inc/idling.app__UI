'use client';

import { useEffect } from 'react';

/* eslint-disable no-console */

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.groupCollapsed('🔧 Service Worker Registration');

          // Step 1: Clean up ALL existing service workers first
          console.log('🧹 Cleaning up existing service workers...');
          const existingRegistrations =
            await navigator.serviceWorker.getRegistrations();

          if (existingRegistrations.length > 0) {
            console.log(
              `Found ${existingRegistrations.length} existing service worker(s)`
            );

            // Unregister all existing service workers
            await Promise.all(
              existingRegistrations.map(async (registration) => {
                try {
                  await registration.unregister();
                  console.log('✅ Unregistered old service worker');
                } catch (e) {
                  console.warn('⚠️ Failed to unregister service worker:', e);
                }
              })
            );

            // Wait a moment for cleanup to complete
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

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

          // Step 4: Register new service worker with aggressive cache control
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

          // Step 5: Handle service worker updates
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
                  // Reload page to use new service worker
                  window.location.reload();
                }
              });
            }
          });

          // Step 6: Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              console.log(
                `🔄 Service worker updated to version ${event.data.version}`
              );
              // Optionally show user notification about update
            }
          });

          // Step 7: Handle service worker controller changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('👑 Service worker controller changed');
            // Reload to ensure we're using the new service worker
            window.location.reload();
          });

          // Step 8: Periodic cleanup check (every hour)
          const cleanupInterval = setInterval(
            async () => {
              try {
                const registrations =
                  await navigator.serviceWorker.getRegistrations();
                if (registrations.length > 1) {
                  console.log(
                    '🧹 Multiple service workers detected, cleaning up...'
                  );

                  // Keep only the most recent registration
                  const sortedRegistrations = [...registrations].sort(
                    (
                      a: ServiceWorkerRegistration,
                      b: ServiceWorkerRegistration
                    ) => {
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
                    }
                  );

                  // Unregister all but the first (most recent)
                  for (let i = 1; i < sortedRegistrations.length; i++) {
                    try {
                      await sortedRegistrations[i].unregister();
                      console.log('✅ Cleaned up old service worker');
                    } catch (e) {
                      console.warn(
                        '⚠️ Failed to cleanup old service worker:',
                        e
                      );
                    }
                  }
                }
              } catch (e) {
                console.warn('⚠️ Periodic cleanup failed:', e);
              }
            },
            60 * 60 * 1000
          ); // Every hour

          // Cleanup interval on component unmount
          return () => {
            clearInterval(cleanupInterval);
          };
        } catch (err) {
          console.error('❌ Service worker registration failed:', err);

          // Enhanced fallback registration attempts
          if (err instanceof Error) {
            console.log(
              '🔄 Attempting fallback service worker registration...'
            );

            try {
              // Try with minimal options
              const fallbackRegistration =
                await navigator.serviceWorker.register('/sw.js', {
                  updateViaCache: 'none'
                });
              console.log(
                '✅ Fallback service worker registration successful:',
                fallbackRegistration.scope
              );
            } catch (fallbackErr) {
              console.error(
                '❌ Fallback service worker registration also failed:',
                fallbackErr
              );

              // Last resort: try with no options
              try {
                const lastResortRegistration =
                  await navigator.serviceWorker.register('/sw.js');
                console.log(
                  '✅ Last resort service worker registration successful:',
                  lastResortRegistration.scope
                );
              } catch (lastResortErr) {
                console.error(
                  '❌ All service worker registration attempts failed:',
                  lastResortErr
                );
              }
            }
          }
        } finally {
          console.groupEnd();
        }
      };

      // Start registration process
      registerServiceWorker();

      // Listen for page visibility changes to trigger cleanup
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          // Check for multiple registrations when page becomes visible
          try {
            const registrations =
              await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 1) {
              console.log(
                '🧹 Page visible: cleaning up multiple service workers...'
              );

              // Unregister all but the most recent
              for (let i = 1; i < registrations.length; i++) {
                try {
                  await registrations[i].unregister();
                  console.log(
                    '✅ Cleaned up old service worker on visibility change'
                  );
                } catch (e) {
                  console.warn(
                    '⚠️ Failed to cleanup service worker on visibility change:',
                    e
                  );
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ Visibility change cleanup failed:', e);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup on component unmount
      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      };
    }
  }, []);

  return null;
}
