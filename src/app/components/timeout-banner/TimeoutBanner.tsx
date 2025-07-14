'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface TimeoutInfo {
  is_timed_out: boolean;
  expires_at?: string;
  reason?: string;
  userInfo?: {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
  };
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Enhanced TimeoutBanner that reads timeout data from API response wrappers
 * instead of polling the dedicated endpoint
 */
export default function TimeoutBanner() {
  const { data: session, status } = useSession();
  const [timeoutInfo, setTimeoutInfo] = useState<TimeoutInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Process wrapper data from any API response to extract timeout information
   * This replaces the polling endpoint since the data is now on every response
   */
  const processTimeoutData = (responseData: any) => {
    if (!responseData?.timeoutInfo) return;

    const timeout = responseData.timeoutInfo;
    if (timeout.is_timed_out && timeout.expires_at) {
      setTimeoutInfo({
        is_timed_out: timeout.is_timed_out,
        expires_at: timeout.expires_at,
        reason: timeout.reason,
        userInfo: timeout.userInfo
      });
    } else {
      setTimeoutInfo(null);
    }
    setIsLoading(false);
  };

  // Expose the processing function globally so other components can call it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__processTimeoutData = processTimeoutData;
    }
  }, []);

  // Initial loading state management
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      setIsLoading(false);
      setTimeoutInfo(null);
      return;
    }

    // If we have a session but no timeout data yet, mark as loading
    // The timeout data will be populated when any API call is made
    setIsLoading(true);
  }, [session?.user?.id, status]);

  // Update countdown timer
  useEffect(() => {
    if (!timeoutInfo?.is_timed_out || !timeoutInfo.expires_at) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(timeoutInfo.expires_at!).getTime();
      const difference = expiresAt - now;

      if (difference <= 0) {
        setTimeRemaining(null);
        setTimeoutInfo(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timeoutInfo]);

  // Don't render if loading or no timeout
  if (isLoading || !timeoutInfo?.is_timed_out || !timeRemaining) {
    return null;
  }

  const formatTimeRemaining = () => {
    const parts = [];

    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }
    if (timeRemaining.hours > 0) {
      parts.push(`${timeRemaining.hours}h`);
    }
    if (timeRemaining.minutes > 0) {
      parts.push(`${timeRemaining.minutes}m`);
    }
    if (timeRemaining.seconds > 0 && timeRemaining.days === 0) {
      parts.push(`${timeRemaining.seconds}s`);
    }

    return parts.join(' ') || '0s';
  };

  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #fed7aa, #fdba74)',
        borderLeft: '4px solid #f97316',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flexShrink: 0, fontSize: '20px' }}>⏰</div>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontWeight: '600',
              fontSize: '16px',
              color: '#9a3412',
              margin: '0 0 4px 0',
              lineHeight: '1.3'
            }}
          >
            Account Temporarily Restricted
          </h4>
          <p
            style={{
              fontSize: '14px',
              color: '#9a3412',
              opacity: 0.9,
              lineHeight: '1.4',
              margin: '0 0 8px 0'
            }}
          >
            You are temporarily restricted from creating posts.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px'
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#f97316',
                animation: 'pulse 2s infinite'
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#9a3412'
              }}
            >
              Expires in {formatTimeRemaining()}
            </span>
          </div>
          {timeoutInfo.reason && (
            <p
              style={{
                fontSize: '11px',
                color: '#9a3412',
                opacity: 0.75,
                margin: '0'
              }}
            >
              Reason: {timeoutInfo.reason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
