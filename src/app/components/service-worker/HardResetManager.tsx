'use client';

import { useEffect } from 'react';
import {
  checkAndPerformHardReset,
  getResetStats
} from '../../../lib/utils/hard-reset-manager';

/* eslint-disable no-console */

export function HardResetManager() {
  useEffect(() => {
    const initializeHardResetSystem = async () => {
      try {
        console.groupCollapsed('🔄 Hard Reset System Initialization');

        // Get current app version from meta tag
        const metaVersion = document
          .querySelector('meta[name="app-version"]')
          ?.getAttribute('content');
        const appVersion = metaVersion || '0.115.0'; // Fallback to current version

        console.log(`Current App Version: ${appVersion}`);

        // Get reset statistics
        const resetStats = getResetStats();
        console.log('Reset Statistics:', resetStats);

        // Check if hard reset is needed for this version
        const resetResult = await checkAndPerformHardReset({
          resetVersion: appVersion,
          resetReason: `Updated to version ${appVersion}`,
          showNotification: true
        });

        console.log('Hard Reset Result:', resetResult);

        if (resetResult.resetPerformed) {
          console.log(
            '🎉 Hard reset completed - user will experience fresh app state'
          );

          // Optional: Reload page after reset to ensure clean state
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          console.log(
            '✅ No hard reset needed - continuing with normal startup'
          );
        }

        console.groupEnd();
      } catch (error) {
        console.error('❌ Hard reset system initialization failed:', error);
      }
    };

    // Initialize hard reset system
    initializeHardResetSystem();

    // Listen for manual reset triggers (for development/admin)
    const handleManualReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (
        customEvent.detail &&
        customEvent.detail.trigger === 'manual-hard-reset'
      ) {
        console.log('🔧 Manual hard reset triggered');
        checkAndPerformHardReset({
          resetVersion: Date.now().toString(),
          forceReset: true,
          resetReason: customEvent.detail.reason || 'Manual reset triggered',
          showNotification: true
        }).then((result) => {
          console.log('Manual reset result:', result);
          if (result.resetPerformed) {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        });
      }
    };

    window.addEventListener('hard-reset-trigger', handleManualReset);

    // Cleanup
    return () => {
      window.removeEventListener('hard-reset-trigger', handleManualReset);
    };
  }, []);

  return null;
}

// Global function to trigger manual hard reset (for console/admin use)
if (typeof window !== 'undefined') {
  (window as any).triggerHardReset = (
    reason: string = 'Manual admin reset'
  ) => {
    const event = new CustomEvent('hard-reset-trigger', {
      detail: {
        trigger: 'manual-hard-reset',
        reason
      }
    });
    window.dispatchEvent(event);
  };
}
