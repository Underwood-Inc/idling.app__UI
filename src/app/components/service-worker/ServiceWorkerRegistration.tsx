'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Wait for the page to be fully loaded
          if (document.readyState !== 'complete') {
            await new Promise((resolve) => {
              window.addEventListener('load', resolve, { once: true });
            });
          }

          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none' // Prevent caching of the service worker itself
            }
          );

          // eslint-disable-next-line no-console
          console.log(
            'ServiceWorker registration successful:',
            registration.scope
          );

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker is available
                  // eslint-disable-next-line no-console
                  console.log(
                    'New service worker available, will activate on next page load'
                  );
                }
              });
            }
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('ServiceWorker registration failed:', err);

          // If registration fails due to redirect issues, try alternative approaches
          if (err instanceof Error && err.message.includes('redirect')) {
            // eslint-disable-next-line no-console
            console.log(
              'Attempting service worker registration with different options...'
            );

            try {
              // Try without explicit scope
              const fallbackRegistration =
                await navigator.serviceWorker.register('/sw.js', {
                  updateViaCache: 'none'
                });
              // eslint-disable-next-line no-console
              console.log(
                'ServiceWorker fallback registration successful:',
                fallbackRegistration.scope
              );
            } catch (fallbackErr) {
              // eslint-disable-next-line no-console
              console.warn(
                'ServiceWorker fallback registration also failed:',
                fallbackErr
              );
            }
          }
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null;
}
