'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // eslint-disable-next-line no-console
            console.log('ServiceWorker registration successful');
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
  }, []);

  return null;
}
