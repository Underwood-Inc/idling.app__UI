'use client';

import { createLogger } from '@/lib/logging';
import { useEffect } from 'react';
import {
  checkAndPerformHardReset,
  getResetStats
} from '../../../lib/utils/hard-reset-manager';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'HardResetManager'
  }
});

export function HardResetManager() {
  useEffect(() => {
    const initializeHardResetSystem = async () => {
      try {
        logger.group('hardResetInitialization');

        // Get current app version from meta tag
        const metaVersion = document
          .querySelector('meta[name="app-version"]')
          ?.getAttribute('content');
        const appVersion = metaVersion || '0.115.0'; // Fallback to current version

        logger.debug('Current app version detected', {
          appVersion,
          metaVersion
        });

        // Get reset statistics
        const resetStats = getResetStats();
        logger.debug('Reset statistics retrieved', { resetStats });

        // Check if hard reset is needed for this version
        const resetResult = await checkAndPerformHardReset({
          resetVersion: appVersion,
          resetReason: `Updated to version ${appVersion}`,
          showNotification: true
        });

        logger.debug('Hard reset check completed', { resetResult });

        if (resetResult.resetPerformed) {
          logger.info(
            'Hard reset completed - user will experience fresh app state'
          );

          // Optional: Reload page after reset to ensure clean state
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          logger.debug('No hard reset needed - continuing with normal startup');
        }

        logger.groupEnd();
      } catch (error) {
        logger.error('Hard reset system initialization failed', {
          error: error instanceof Error ? error.message : String(error)
        });
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
        logger.debug('Manual hard reset triggered', {
          reason: customEvent.detail.reason
        });

        checkAndPerformHardReset({
          resetVersion: Date.now().toString(),
          forceReset: true,
          resetReason: customEvent.detail.reason || 'Manual reset triggered',
          showNotification: true
        }).then((result) => {
          logger.debug('Manual reset completed', { result });
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
