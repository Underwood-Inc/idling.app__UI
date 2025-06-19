'use client';

/* eslint-disable no-console */
import React, { useState } from 'react';
import './CacheStatus.css';

const NoCacheStatus: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllCaches = async () => {
    if (isClearing) return;

    setIsClearing(true);
    // eslint-disable-next-line no-console
    console.log('🧹 Clearing all caches...');

    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('✅ Service worker unregistered');
        }
      }

      // Clear all cache storage
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

      // Clear localStorage (but preserve important user data)
      const keysToPreserve = ['auth-token', 'user-preferences'];
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach((key) => {
        if (!keysToPreserve.some((preserve) => key.includes(preserve))) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ localStorage cleared (preserved auth)');

      console.log('🎉 All caches cleared! Refreshing...');

      // Small delay to show feedback
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      // Fallback: hard refresh anyway
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="cache-status">
      <span className="cache-status__indicator cache-status__indicator--live">
        ●
      </span>
      <span className="cache-status__text">No Cache</span>
      <button
        className="cache-status__refresh"
        onClick={clearAllCaches}
        disabled={isClearing}
        title="Clear all caches and refresh"
        aria-label="Clear all caches and refresh page"
      >
        {isClearing ? '⟳' : '🧹'}
      </button>
    </div>
  );
};

export default NoCacheStatus;
