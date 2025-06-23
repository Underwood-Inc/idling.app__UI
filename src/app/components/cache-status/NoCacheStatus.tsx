'use client';

/* eslint-disable no-console */
import { signOut } from 'next-auth/react';
import React, { useState } from 'react';
import './CacheStatus.css';

const NoCacheStatus: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllCaches = async () => {
    if (isClearing) return;

    setIsClearing(true);
    console.log(
      '🧹 Clearing ALL site data, logging out user, and restarting service workers...'
    );

    try {
      // Step 1: Logout user properly (server + client + JWT + cookies)
      console.log('🚪 Logging out user...');
      try {
        await signOut({
          redirect: false, // Don't redirect, we'll handle the refresh manually
          callbackUrl: '/' // Set callback URL for after refresh
        });
        console.log('✅ User logged out from NextAuth');
      } catch (error) {
        console.warn(
          '⚠️ NextAuth logout failed, continuing with cache clear:',
          error
        );
      }

      // Step 2: Get storage estimate before clearing (for logging)
      let storageBeforeClear = null;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          storageBeforeClear = await navigator.storage.estimate();
          const usedMB =
            Math.round(((storageBeforeClear.usage || 0) / 1024 / 1024) * 100) /
            100;
          const quotaMB =
            Math.round(((storageBeforeClear.quota || 0) / 1024 / 1024) * 100) /
            100;
          console.log(
            `📊 Storage before clear: ${usedMB}MB used of ${quotaMB}MB available`
          );
        } catch (e) {
          console.log('ℹ️ Could not get storage estimate');
        }
      }

      // Step 3: Clear site data using modern Storage API (if available)
      if ('storage' in navigator && 'persist' in navigator.storage) {
        try {
          // Request persistent storage (helps with clearing)
          await navigator.storage.persist();
          console.log('✅ Storage persistence requested');
        } catch (e) {
          console.log('ℹ️ Storage persistence not available');
        }
      }

      // Step 4: Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('✅ Service worker unregistered');
        }
      }

      // Step 5: Clear all cache storage
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

      // Step 6: Clear ALL application storage (including auth data)
      console.log('🗑️ Clearing ALL application storage...');

      // Clear localStorage completely (including auth tokens)
      localStorage.clear();
      console.log('✅ localStorage cleared completely');

      // Clear sessionStorage completely
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');

      // Step 7: Clear all cookies (auth-related and others)
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Clear cookie for current domain and all possible paths
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
        console.log('✅ All cookies cleared');
      }

      // Step 8: Clear IndexedDB completely
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map((db) => {
              if (db.name) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => {
                    console.log(`✅ IndexedDB ${db.name} cleared`);
                    resolve(undefined);
                  };
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
        } catch (e) {
          console.log(
            'ℹ️ IndexedDB clearing not supported or no databases found'
          );
        }
      }

      // Step 9: Clear WebSQL (if supported - deprecated but still present in some browsers)
      if ('webkitStorageInfo' in window) {
        try {
          const webkitStorageInfo = (window as any).webkitStorageInfo;
          if (webkitStorageInfo && webkitStorageInfo.requestQuota) {
            console.log('🗑️ Attempting to clear WebSQL...');
            webkitStorageInfo.requestQuota(
              0,
              0,
              () => {
                console.log('✅ WebSQL cleared');
              },
              () => {
                console.log('ℹ️ WebSQL clearing failed or not supported');
              }
            );
          }
        } catch (e) {
          console.log('ℹ️ WebSQL not available');
        }
      }

      // Step 10: Clear Application Cache (if supported - deprecated but still present)
      if ('applicationCache' in window && window.applicationCache) {
        try {
          (window.applicationCache as any).update();
          console.log('✅ Application cache updated');
        } catch (e) {
          console.log('ℹ️ Application cache not available');
        }
      }

      console.log(
        '🎉 All site data and user session cleared! Re-registering service worker...'
      );

      // Step 11: Re-register service worker with better error handling
      if ('serviceWorker' in navigator) {
        try {
          // Clear any existing service worker controller
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SKIP_WAITING'
            });
          }

          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none' // Ensure fresh service worker
            }
          );
          console.log('✅ Service worker re-registered:', registration.scope);

          // Wait for the new service worker to be ready
          await new Promise((resolve) => {
            if (registration.active) {
              resolve(undefined);
            } else {
              registration.addEventListener('statechange', () => {
                if (registration.active) {
                  resolve(undefined);
                }
              });
            }
          });
        } catch (error) {
          console.warn('⚠️ Failed to re-register service worker:', error);
          console.log(
            'ℹ️ This may be due to redirect issues - will continue with refresh'
          );
        }
      }

      // Step 12: Get storage estimate after clearing (for verification)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const storageAfterClear = await navigator.storage.estimate();
          const usedAfterMB =
            Math.round(((storageAfterClear.usage || 0) / 1024 / 1024) * 100) /
            100;
          const quotaAfterMB =
            Math.round(((storageAfterClear.quota || 0) / 1024 / 1024) * 100) /
            100;
          console.log(
            `📊 Storage after clear: ${usedAfterMB}MB used of ${quotaAfterMB}MB available`
          );

          if (
            storageBeforeClear &&
            storageAfterClear.usage !== undefined &&
            storageBeforeClear.usage !== undefined
          ) {
            const clearedMB =
              Math.round(
                ((storageBeforeClear.usage - storageAfterClear.usage) /
                  1024 /
                  1024) *
                  100
              ) / 100;
            console.log(`🗑️ Successfully cleared ${clearedMB}MB of site data`);
          }
        } catch (e) {
          console.log('ℹ️ Could not verify storage clearing');
        }
      }

      // Step 13: Perform hard refresh to complete logout and restart
      setTimeout(() => {
        console.log(
          '🔄 Performing final hard refresh with complete session reset...'
        );
        // Use replace to avoid back button issues and ensure clean state
        window.location.replace('/');
      }, 1000);
    } catch (error) {
      console.error(
        '❌ Error during complete site data and session clear:',
        error
      );
      // Fallback: force hard refresh to home page anyway
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
    } finally {
      setIsClearing(false);
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
        title="Logout user, clear all site data (cache, storage, cookies), and re-register service workers"
        aria-label="Complete logout and clear all site data"
      >
        {isClearing ? '⟳' : '🧹'}
      </button>
    </div>
  );
};

export default NoCacheStatus;
