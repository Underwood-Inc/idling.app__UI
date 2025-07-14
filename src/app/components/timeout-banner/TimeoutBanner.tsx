'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import './TimeoutBanner.css';

interface TimeoutInfo {
  is_timed_out: boolean;
  expires_at?: string;
  reason?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function TimeoutBanner() {
  const { data: session, status } = useSession();
  const [timeoutInfo, setTimeoutInfo] = useState<TimeoutInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Check timeout status
  useEffect(() => {
    // Wait for session to be loaded and authenticated
    if (status === 'loading') return;

    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const checkTimeout = async () => {
      try {
        const response = await fetch(`/api/user/timeout?type=post_creation`, {
          credentials: 'include' // Ensure authentication headers are sent
        });
        if (response.ok) {
          const data = await response.json();
          setTimeoutInfo(data);
        } else if (response.status === 401) {
          // User session expired, don't log this as an error
          // eslint-disable-next-line no-console
          console.debug('User session expired, skipping timeout check');
        }
      } catch (error) {
        console.error('Error checking timeout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTimeout();

    // Check every minute for updates
    const interval = setInterval(checkTimeout, 60000);
    return () => clearInterval(interval);
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
    <div className="timeout-banner">
      <div className="timeout-banner__content">
        <div className="timeout-banner__icon">⏰</div>
        <div className="timeout-banner__text">
          <div className="timeout-banner__title">
            You are temporarily restricted from creating posts
          </div>
          <div className="timeout-banner__details">
            <span className="timeout-banner__reason">
              Reason: {timeoutInfo.reason}
            </span>
            <span className="timeout-banner__timer">
              Time remaining: {formatTimeRemaining()}
            </span>
          </div>
        </div>
        <div className="timeout-banner__close">
          <button
            onClick={() => setTimeoutInfo(null)}
            className="timeout-banner__close-btn"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
