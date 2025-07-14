'use client';

/**
 * Enhanced Simple Banner System
 *
 * Beautiful, animated banner system with live timers and modern UX.
 * Shows rate limit, timeout, and database alerts via polling with delightful interactions.
 */

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { SimpleBanner } from './SimpleBanner';

// Force logging function to bypass console silencer - but only for important events
const forceLog = (
  message: string,
  data?: any,
  level: 'info' | 'warn' | 'error' | 'debug' = 'debug'
) => {
  // Only log errors and warnings now - remove debug spam
  if (level === 'debug' || level === 'info') {
    return;
  }

  if (typeof window !== 'undefined' && (window as any).__originalConsole) {
    const logMethod =
      (window as any).__originalConsole[level] ||
      (window as any).__originalConsole.log;
    logMethod(message, data);
  }
};

export interface BannerData {
  id: string;
  type: 'alert' | 'timeout' | 'rate-limit';
  title: string;
  message: string;
  dismissible?: boolean;
  priority?: number;
  retryAfter?: number;
  createdAt?: number;
  metadata?: {
    reason?: string;
    expiresAt?: string;
    alertType?: string;
    userId?: number;
  };
}

// Helper function to check if banners are equal
const areBannersEqual = (a: BannerData[], b: BannerData[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((banner, index) => {
    const other = b[index];
    return (
      banner.id === other.id &&
      banner.type === other.type &&
      banner.title === other.title &&
      banner.message === other.message &&
      banner.dismissible === other.dismissible &&
      banner.priority === other.priority &&
      banner.retryAfter === other.retryAfter &&
      JSON.stringify(banner.metadata) === JSON.stringify(other.metadata)
    );
  });
};

// Helper function to get dismissed alerts from localStorage
const getDismissedAlerts = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const dismissed = localStorage.getItem('dismissed-alerts');
    return dismissed ? new Set(JSON.parse(dismissed)) : new Set();
  } catch {
    return new Set();
  }
};

// Helper function to save dismissed alerts to localStorage
const saveDismissedAlerts = (alertIds: Set<string>): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dismissed-alerts', JSON.stringify([...alertIds]));
  } catch {
    // Ignore localStorage errors
  }
};

// Helper function to clean up old dismissed alerts
const cleanupDismissedAlerts = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = localStorage.getItem('dismissed-alerts');
    if (dismissed) {
      const alertIds = JSON.parse(dismissed);
      // Keep only recent dismissals (last 7 days)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      // For now, just clear all old dismissals since we don't store timestamps
      // In a future enhancement, we could store {id, dismissedAt} objects
      localStorage.setItem('dismissed-alerts', JSON.stringify([]));
    }
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Enhanced banner system that reads banner data from API response wrappers
 * instead of polling dedicated endpoints
 */
export function useSimpleBanners() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const { data: session, status } = useSession();
  const lastProcessedDataRef = useRef<string>('');

  // Clean up dismissed alerts on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanupDismissedAlerts();
    }
  }, []);

  /**
   * Process wrapper data from any API response to extract banner information
   * This replaces the polling endpoints since the data is now on every response
   */
  const processWrapperData = (responseData: any) => {
    if (!responseData) return;

    const newBanners: BannerData[] = [];
    const dismissedAlerts = getDismissedAlerts();

    // 1. Process activeAlertsInfo (from withActiveAlerts wrapper)
    if (responseData.activeAlertsInfo?.alerts) {
      responseData.activeAlertsInfo.alerts.forEach((alert: any) => {
        const alertId = `alert-${alert.id}`;

        // Skip dismissed alerts
        if (dismissedAlerts.has(alertId)) return;

        newBanners.push({
          id: alertId,
          type: 'alert',
          title: alert.title,
          message: alert.message || '',
          dismissible: alert.dismissible,
          priority: alert.priority || 0,
          createdAt: Date.now(),
          metadata: {
            alertType: alert.alert_type,
            reason: alert.details
          }
        });
      });
    }

    // 2. Process timeoutInfo (from withTimeoutInfo wrapper)
    if (
      responseData.timeoutInfo?.is_timed_out &&
      responseData.timeoutInfo.expires_at
    ) {
      const timeoutId = 'timeout-banner';

      // Skip if dismissed
      if (!dismissedAlerts.has(timeoutId)) {
        newBanners.push({
          id: timeoutId,
          type: 'timeout',
          title: 'Account Temporarily Restricted',
          message: 'You are temporarily restricted from creating posts.',
          dismissible: true,
          priority: 90,
          createdAt: Date.now(),
          metadata: {
            reason: responseData.timeoutInfo.reason,
            expiresAt: responseData.timeoutInfo.expires_at
          }
        });
      }
    }

    // 3. Check sessionStorage for rate limit info (still needed for interceptor data)
    if (typeof window !== 'undefined') {
      const rateLimitInfo = sessionStorage.getItem('rate-limit-info');
      if (rateLimitInfo) {
        try {
          const info = JSON.parse(rateLimitInfo);
          const rateLimitId = `rate-limit-${info.endpoint || 'general'}`;

          if (!dismissedAlerts.has(rateLimitId)) {
            newBanners.push({
              id: rateLimitId,
              type: 'rate-limit',
              title: 'Rate Limit Exceeded',
              message: `Too many requests. Please wait ${info.retryAfter || 60} seconds before trying again.`,
              dismissible: true,
              priority: 80,
              retryAfter: info.retryAfter || 60,
              createdAt: Date.now(),
              metadata: {
                reason: 'rate_limit_exceeded'
              }
            });
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }

    // Update banners if data changed
    const dataSignature = JSON.stringify(newBanners);
    if (lastProcessedDataRef.current !== dataSignature) {
      lastProcessedDataRef.current = dataSignature;

      setBanners((prev) => {
        // Filter out expired rate limit banners
        const validExisting = prev.filter((banner) => {
          if (banner.type === 'rate-limit' && banner.retryAfter) {
            const elapsed = (Date.now() - (banner.createdAt || 0)) / 1000;
            return elapsed < banner.retryAfter;
          }
          return true;
        });

        // Merge with new banners, avoiding duplicates
        const existingIds = new Set(validExisting.map((b) => b.id));
        const filteredNew = newBanners.filter((b) => !existingIds.has(b.id));

        const finalBanners = [...validExisting, ...filteredNew];

        // Only update if actually different
        if (areBannersEqual(prev, finalBanners)) {
          return prev;
        }

        return finalBanners;
      });
    }
  };

  // Expose the processing function so components can call it with their API response data
  return {
    banners,
    processWrapperData,
    dismissBanner: (id: string) => {
      const dismissed = getDismissedAlerts();
      dismissed.add(id);
      saveDismissedAlerts(dismissed);
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
    }
  };
}

export default function SimpleBannerSystem() {
  const { banners, dismissBanner } = useSimpleBanners();

  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      {banners
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .map((banner) => (
          <SimpleBanner
            key={banner.id}
            id={banner.id}
            type={banner.type}
            title={banner.title}
            message={banner.message}
            dismissible={banner.dismissible}
            onDismiss={() => dismissBanner(banner.id)}
            metadata={banner.metadata}
            retryAfter={banner.retryAfter}
            createdAt={banner.createdAt}
          />
        ))}
    </div>
  );
}
