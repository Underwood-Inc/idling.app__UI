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
      '🧹 Clearing ALL caches, logging out user, and restarting service workers...'
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

      // Step 2: Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('✅ Service worker unregistered');
        }
      }

      // Step 3: Clear all cache storage
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

      // Step 4: Clear ALL application storage (including auth data)
      console.log('🗑️ Clearing ALL application storage...');

      // Clear localStorage completely (including auth tokens)
      localStorage.clear();
      console.log('✅ localStorage cleared completely');

      // Clear sessionStorage completely
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');

      // Step 5: Clear all cookies (auth-related and others)
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

      // Step 6: Clear IndexedDB completely
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

      console.log(
        '🎉 All caches and user session cleared! Re-registering service worker...'
      );

      // Step 7: Re-register service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/'
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
        }
      }

      // Step 8: Perform hard refresh to complete logout and restart
      setTimeout(() => {
        console.log(
          '🔄 Performing final hard refresh with complete session reset...'
        );
        // Use replace to avoid back button issues and ensure clean state
        window.location.replace('/');
      }, 1000);
    } catch (error) {
      console.error('❌ Error during complete cache and session clear:', error);
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
        title="Logout user, clear all caches, storage, and re-register service workers"
        aria-label="Complete logout and clear all application data"
      >
        {isClearing ? '⟳' : '🧹'}
      </button>
    </div>
  );
};

export default NoCacheStatus;
