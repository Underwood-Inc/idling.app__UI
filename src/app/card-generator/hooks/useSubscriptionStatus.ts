import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isPro: boolean;
  currentPlan?: {
    id: number;
    name: string;
    display_name: string;
    plan_type: string;
  };
  subscription?: {
    id: number;
    status: string;
    billing_cycle?: string;
    expires_at?: string;
    has_price_override: boolean;
    price_override_cents?: number;
  };
}

export function useSubscriptionStatus() {
  const { data: session, status } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>({
      hasActiveSubscription: false,
      isPro: false
    });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Don't cache subscription status - always get fresh data
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const response = await noCacheFetch(
        `/api/subscription/status?_t=${cacheBuster}`,
        {
          headers: {
            'X-Background-Request': 'true' // Mark as background to skip global loader
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch subscription status'
      );

      // Set safe defaults on error
      setSubscriptionStatus({
        hasActiveSubscription: false,
        isPro: false
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch subscription status when session is ready
  useEffect(() => {
    if (status === 'loading') return;

    // Only fetch if user is authenticated - unauthenticated users don't have subscriptions
    if (status === 'authenticated' && session?.user?.id) {
      fetchSubscriptionStatus();
    } else {
      // Set defaults for unauthenticated users
      setSubscriptionStatus({
        hasActiveSubscription: false,
        isPro: false
      });
      setIsLoading(false);
    }
  }, [status, session?.user?.id, fetchSubscriptionStatus]);

  // Refresh subscription status when session changes
  useEffect(() => {
    if (
      status !== 'loading' &&
      status === 'authenticated' &&
      session?.user?.id
    ) {
      fetchSubscriptionStatus();
    }
  }, [session?.user?.id, status, fetchSubscriptionStatus]);

  return {
    ...subscriptionStatus,
    isLoading,
    error,
    refetch: fetchSubscriptionStatus
  };
}
