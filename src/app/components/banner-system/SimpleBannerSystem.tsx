'use client';

/**
 * Enhanced Simple Banner System
 *
 * Beautiful, animated banner system with live timers and modern UX.
 * Shows rate limit, timeout, and database alerts via polling with delightful interactions.
 */

import { useSession } from 'next-auth/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

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

interface BannerData {
  id: string;
  type: string;
  title: string;
  message: string;
  dismissible?: boolean;
  priority?: number;
  retryAfter?: number;
  metadata?: Record<string, any>;
  createdAt?: number;
}

interface DatabaseAlert {
  id: number;
  title: string;
  message?: string;
  details?: string;
  alert_type: string;
  priority: number;
  icon?: string;
  dismissible: boolean;
  persistent: boolean;
  expires_at?: string;
  actions?: any;
  metadata?: any;
}

// Helper function to create a stable key for banner comparison
const createBannerKey = (banner: BannerData): string => {
  return `${banner.id}-${banner.type}-${banner.title}-${banner.message}-${banner.priority}-${banner.dismissible}`;
};

// Helper function to check if two banner arrays are equivalent
const areBannersEqual = (prev: BannerData[], next: BannerData[]): boolean => {
  if (prev.length !== next.length) return false;

  const prevKeys = prev.map(createBannerKey).sort();
  const nextKeys = next.map(createBannerKey).sort();

  return prevKeys.every((key, index) => key === nextKeys[index]);
};

export function useSimpleBanners() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const { data: session } = useSession();
  const lastFetchRef = useRef<string>(''); // Track last successful fetch signature

  // Check for all types of banners via polling
  useEffect(() => {
    const checkForBanners = async () => {
      try {
        const newBanners: BannerData[] = [];

        // 1. Check for database alerts (for all users - testing mode)
        try {
          const alertsResponse = await fetch('/api/alerts/active');

          if (alertsResponse.ok) {
            const dbAlerts: DatabaseAlert[] = await alertsResponse.json();

            dbAlerts.forEach((alert) => {
              const bannerData = {
                id: `alert-${alert.id}`,
                type: alert.alert_type,
                title: alert.title,
                message: alert.message || alert.details || '',
                dismissible: alert.dismissible,
                priority: alert.priority,
                createdAt: Date.now(),
                metadata: {
                  ...alert.metadata,
                  icon: alert.icon,
                  actions: alert.actions,
                  expiresAt: alert.expires_at,
                  persistent: alert.persistent
                }
              };
              newBanners.push(bannerData);
            });
          }
        } catch (error) {
          forceLog('Failed to fetch database alerts:', error, 'error');
        }

        // 2. Check for timeouts (authenticated users only)
        if (session?.user?.id) {
          try {
            const timeoutResponse = await fetch(
              '/api/user/timeout?type=post_creation'
            );
            if (timeoutResponse.ok) {
              const timeoutInfo = await timeoutResponse.json();

              if (timeoutInfo.is_timed_out && timeoutInfo.expires_at) {
                newBanners.push({
                  id: 'timeout-banner',
                  type: 'timeout',
                  title: 'Account Temporarily Restricted',
                  message:
                    'You are temporarily restricted from creating posts.',
                  dismissible: true,
                  priority: 90,
                  createdAt: Date.now(),
                  metadata: {
                    reason: timeoutInfo.reason,
                    expiresAt: timeoutInfo.expires_at
                  }
                });
              }
            }
          } catch (error) {
            forceLog('Failed to fetch timeout info:', error, 'error');
          }
        }

        // 3. Check sessionStorage for rate limit info (set by fetch interceptor)
        const rateLimitInfo = sessionStorage.getItem('rate-limit-info');
        if (rateLimitInfo) {
          try {
            const info = JSON.parse(rateLimitInfo);
            if (info.retryAfter && info.retryAfter > 0) {
              newBanners.push({
                id: 'rate-limit-banner',
                type: 'rate-limit',
                title: 'Rate Limit Exceeded',
                message: info.error || 'Too many requests. Please slow down.',
                dismissible: true,
                priority: 100,
                retryAfter: info.retryAfter,
                createdAt: Date.now(),
                metadata: {
                  quotaType: info.quotaType,
                  penaltyLevel: info.penaltyLevel,
                  isAttack: info.penaltyLevel >= 3
                }
              });
              sessionStorage.removeItem('rate-limit-info');
            }
          } catch (error) {
            forceLog('Failed to parse rate limit info:', error, 'error');
            sessionStorage.removeItem('rate-limit-info');
          }
        }

        // Create a signature of the current fetch to compare with previous
        const currentSignature = JSON.stringify(
          newBanners.map(createBannerKey).sort()
        );

        // Only update state if data actually changed
        if (lastFetchRef.current !== currentSignature) {
          lastFetchRef.current = currentSignature;

          setBanners((prev) => {
            // Merge with existing banners, avoiding duplicates
            const existingIds = new Set(prev.map((b) => b.id));
            const filteredNew = newBanners.filter(
              (b) => !existingIds.has(b.id)
            );

            // Keep existing banners that are still valid
            const validExisting = prev.filter((banner) => {
              // Keep rate limit banners if they still have time left
              if (banner.type === 'rate-limit' && banner.retryAfter) {
                const elapsed = (Date.now() - (banner.createdAt || 0)) / 1000;
                return elapsed < banner.retryAfter;
              }
              // Keep other banners if they match new data
              return newBanners.some((nb) => nb.id === banner.id);
            });

            const finalBanners = [...validExisting, ...filteredNew];

            // Double-check: only return new array if actually different
            if (areBannersEqual(prev, finalBanners)) {
              return prev; // Return same reference to prevent rerender
            }

            return finalBanners;
          });
        }
      } catch (error) {
        forceLog('Error checking for banners:', error, 'error');
      }
    };

    // Check immediately and then every 5 seconds (more responsive)
    checkForBanners();
    const interval = setInterval(checkForBanners, 5000);

    // Listen for manual refresh events
    const handleRefresh = () => checkForBanners();
    window.addEventListener('refresh-alerts', handleRefresh);

    // Listen for admin panel changes
    const handleAdminChange = () => {
      // Immediate refresh when admin makes changes
      setTimeout(checkForBanners, 100); // Small delay to let the API update
    };
    window.addEventListener('alert-admin-change', handleAdminChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-alerts', handleRefresh);
      window.removeEventListener('alert-admin-change', handleAdminChange);
    };
  }, [session?.user?.id]);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));

    // If dismissing a database alert, record the dismissal
    if (id.startsWith('alert-')) {
      const alertId = id.replace('alert-', '');
      fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch((error) => {
        forceLog('Failed to record alert dismissal:', error);
      });
    }
  }, []);

  return {
    banners,
    dismissBanner
  };
}

const Banner = React.memo(function Banner({
  banner,
  onDismiss
}: {
  banner: BannerData;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(banner.retryAfter || 0);
  const [progress, setProgress] = useState(100);

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Live countdown timer - memoized to prevent unnecessary recalculations
  useEffect(() => {
    if (!banner.retryAfter) return;

    const startTime = banner.createdAt || Date.now();
    const endTime = startTime + banner.retryAfter * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      const progressPercent =
        banner.retryAfter && banner.retryAfter > 0
          ? Math.max(0, (remaining / banner.retryAfter) * 100)
          : 0;

      setTimeLeft(remaining);
      setProgress(progressPercent);

      if (remaining <= 0) {
        handleDismiss();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [banner.retryAfter, banner.createdAt]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(banner.id), 300);
  }, [banner.id, onDismiss]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  }, []);

  const config = useMemo(() => {
    const isRateLimit = banner.type === 'rate-limit';
    const isAttack = banner.metadata?.isAttack;
    const isTimeout = banner.type === 'timeout';

    // Use custom icon if provided
    const customIcon = banner.metadata?.icon;

    if (isAttack) {
      return {
        icon: customIcon || '🚨',
        bgGradient: 'linear-gradient(135deg, #fee2e2, #fecaca)',
        borderColor: '#f87171',
        textColor: '#991b1b',
        accentColor: '#ef4444',
        progressColor: '#f87171'
      };
    }

    if (isRateLimit) {
      return {
        icon: customIcon || '⚡',
        bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderColor: '#f59e0b',
        textColor: '#92400e',
        accentColor: '#f59e0b',
        progressColor: '#fbbf24'
      };
    }

    if (isTimeout) {
      return {
        icon: customIcon || '⏰',
        bgGradient: 'linear-gradient(135deg, #fed7aa, #fdba74)',
        borderColor: '#f97316',
        textColor: '#9a3412',
        accentColor: '#f97316',
        progressColor: '#fb923c'
      };
    }

    // Handle different alert types from database
    switch (banner.type) {
      case 'warning':
        return {
          icon: customIcon || '⚠️',
          bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderColor: '#f59e0b',
          textColor: '#92400e',
          accentColor: '#f59e0b',
          progressColor: '#fbbf24'
        };

      case 'error':
        return {
          icon: customIcon || '❌',
          bgGradient: 'linear-gradient(135deg, #fee2e2, #fecaca)',
          borderColor: '#f87171',
          textColor: '#991b1b',
          accentColor: '#ef4444',
          progressColor: '#f87171'
        };

      case 'success':
        return {
          icon: customIcon || '✅',
          bgGradient: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
          borderColor: '#34d399',
          textColor: '#065f46',
          accentColor: '#10b981',
          progressColor: '#34d399'
        };

      case 'maintenance':
        return {
          icon: customIcon || '🔧',
          bgGradient: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
          borderColor: '#818cf8',
          textColor: '#3730a3',
          accentColor: '#6366f1',
          progressColor: '#818cf8'
        };

      default:
        return {
          icon: customIcon || 'ℹ️',
          bgGradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
          borderColor: '#60a5fa',
          textColor: '#1e40af',
          accentColor: '#3b82f6',
          progressColor: '#60a5fa'
        };
    }
  }, [banner.type, banner.metadata?.isAttack, banner.metadata?.icon]);

  return (
    <div
      style={{
        width: '100%',
        transform: isVisible
          ? 'translateY(0) scale(1)'
          : 'translateY(-10px) scale(0.98)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-out',
        marginBottom: '8px'
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderLeft: `4px solid ${config.borderColor}`,
          background: config.bgGradient,
          minHeight: '60px',
          width: '100%'
        }}
      >
        {/* Progress bar for timed banners */}
        {banner.retryAfter && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <div
              style={{
                height: '100%',
                background: config.progressColor,
                width: `${progress}%`,
                transition: 'width 1s linear'
              }}
            />
          </div>
        )}

        <div style={{ padding: '12px 16px' }}>
          <div
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
          >
            {/* Icon */}
            <div style={{ flexShrink: 0, fontSize: '20px' }}>{config.icon}</div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: config.textColor,
                  margin: '0 0 4px 0',
                  lineHeight: '1.3'
                }}
              >
                {banner.title}
              </h4>

              {banner.message && (
                <p
                  style={{
                    fontSize: '14px',
                    color: config.textColor,
                    opacity: 0.9,
                    lineHeight: '1.4',
                    margin: '0'
                  }}
                >
                  {banner.message}
                </p>
              )}

              {/* Live countdown */}
              {timeLeft > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: config.accentColor,
                      animation: 'pulse 2s infinite'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: config.textColor
                    }}
                  >
                    Try again in {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Additional info */}
              {banner.metadata?.reason && (
                <p
                  style={{
                    fontSize: '11px',
                    marginTop: '6px',
                    color: config.textColor,
                    opacity: 0.75
                  }}
                >
                  Reason: {banner.metadata.reason}
                </p>
              )}
            </div>

            {/* Dismiss button */}
            {banner.dismissible && (
              <button
                onClick={handleDismiss}
                style={{
                  flexShrink: 0,
                  padding: '8px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: config.textColor,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function SimpleBannerSystem() {
  const { banners, dismissBanner } = useSimpleBanners();

  // Add global refresh function for testing (but remove debug logging)
  useEffect(() => {
    (window as any).__refreshBanners = () => {
      window.dispatchEvent(new CustomEvent('refresh-alerts'));
    };

    (window as any).__bannerDebug = () => {
      return {
        bannerCount: banners.length,
        banners: banners,
        isSimpleBannerSystemMounted: true
      };
    };
  }, [banners]);

  // Memoize sorted banners to prevent unnecessary re-sorts
  const sortedBanners = useMemo(() => {
    return banners.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [banners]);

  if (banners.length === 0) {
    return null; // Don't show anything when no banners
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: 'auto',
        width: '100%'
      }}
    >
      <div
        style={{
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Banners with proper React keys for optimal rendering */}
          {sortedBanners.map((banner, index) => (
            <div
              key={createBannerKey(banner)} // Stable key that includes content
              style={{
                width: '100%',
                transform: 'translateY(0) scale(1)',
                opacity: 1,
                transition: 'all 0.3s ease-out',
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <Banner banner={banner} onDismiss={dismissBanner} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
