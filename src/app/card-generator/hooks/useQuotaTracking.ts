import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QuotaState } from '../types/generation';

export function useQuotaTracking(): QuotaState & {
  updateQuota: (
    remaining: number,
    limit?: number,
    resetDate?: Date | null
  ) => void;
  initializeQuota: () => Promise<void>;
  clearQuota: () => void;
  quotaError?: string;
} {
  const { data: session, status } = useSession();
  const [remainingGenerations, setRemainingGenerations] = useState<number>(0);
  const [quotaLimit, setQuotaLimit] = useState<number>(0);
  const [hasInitializedQuota, setHasInitializedQuota] =
    useState<boolean>(false);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [quotaError, setQuotaError] = useState<string | undefined>(undefined);

  // Track previous auth state to detect changes
  const previousUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Don't show quota exceeded until we've actually initialized
  const isQuotaExceeded = hasInitializedQuota && remainingGenerations <= 0;

  const updateQuota = useCallback(
    (remaining: number, limit?: number, resetDate?: Date | null) => {
      setRemainingGenerations(remaining);
      if (limit !== undefined) {
        setQuotaLimit(limit);
      }
      if (resetDate !== undefined) {
        setResetDate(resetDate);
      }
      setHasInitializedQuota(true);
    },
    []
  );

  const clearQuota = useCallback(() => {
    setRemainingGenerations(0);
    setQuotaLimit(0);
    setHasInitializedQuota(false);
    setResetDate(null);
    setQuotaError(undefined);
    isInitializedRef.current = false;

    // Clear any localStorage quota cache that might exist
    try {
      localStorage.removeItem('quota_cache');
      localStorage.removeItem('og_quota_info');
      localStorage.removeItem('generation_quota');
    } catch (error) {
      // Ignore localStorage errors in incognito/restricted mode
    }
  }, []);

  const initializeQuota = useCallback(async () => {
    try {
      setQuotaError(undefined); // Clear previous errors

      // ALWAYS make API call - backend handles both authenticated users and guests
      // Guest users have their own quota system via global_guest_quotas table

      // NEVER cache quota data - add cache-busting parameters and headers
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const url = `/api/og-image?format=json&dry-run=true&_t=${cacheBuster}&_nocache=true`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cache-Bust': cacheBuster
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (
          data.remainingGenerations !== undefined &&
          data.quotaLimit !== undefined
        ) {
          // Extract quota limit and reset date from the response
          const limit = data.quotaLimit || data.quota_limit;
          const resetDateValue =
            data.resetDate || data.reset_date
              ? new Date(data.resetDate || data.reset_date)
              : null;
          updateQuota(data.remainingGenerations, limit, resetDateValue);
          isInitializedRef.current = true;
          return; // Success - exit early
        } else {
          console.error('Quota data missing from API response:', data);
          setQuotaError('Quota data missing from API response');
        }
      } else {
        console.error(
          'Failed to initialize quota:',
          response.status,
          response.statusText
        );
        setQuotaError(`Failed to load quota info: ${response.status}`);
      }
    } catch (error) {
      console.error('Error initializing quota:', error);
      setQuotaError('Failed to load quota information');
    }

    // If we get here, something failed - set fallback state
    updateQuota(0, 0, null);
  }, [updateQuota]);

  // Initialize quota when component mounts or auth state changes
  useEffect(() => {
    // Wait for session loading to complete
    if (status === 'loading') return;

    const currentUserId = session?.user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Check if this is the initial mount or if auth state has changed
    const authStateChanged = currentUserId !== previousUserId;
    const isInitialMount = !isInitializedRef.current;

    // Initialize quota for both authenticated and guest users
    if (isInitialMount || authStateChanged) {
      // Clear previous state first - COMPLETELY reset everything
      setRemainingGenerations(0);
      setQuotaLimit(0);
      setHasInitializedQuota(false);
      setResetDate(null);
      setQuotaError(undefined);
      isInitializedRef.current = false;

      // Update tracking refs
      previousUserIdRef.current = currentUserId;

      // Initialize quota (works for both authenticated users and guests)
      initializeQuota().catch(console.error);
    }
  }, [session?.user?.id, status, initializeQuota]);

  // Comprehensive cleanup on unmount - reset everything no matter what
  useEffect(() => {
    return () => {
      // Reset all state values directly
      setRemainingGenerations(0);
      setQuotaLimit(0);
      setHasInitializedQuota(false);
      setResetDate(null);
      setQuotaError(undefined);

      // Reset refs
      previousUserIdRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  // Force refresh quota when user logs out (session becomes null)
  useEffect(() => {
    if (status !== 'loading' && !session) {
      // User has logged out - immediately clear all quota state
      setRemainingGenerations(0);
      setQuotaLimit(0);
      setHasInitializedQuota(false);
      setResetDate(null);
      setQuotaError(undefined);
      isInitializedRef.current = false;
      previousUserIdRef.current = null;
    }
  }, [session, status]);

  return {
    remainingGenerations,
    quotaLimit,
    hasInitializedQuota,
    isQuotaExceeded,
    resetDate,
    updateQuota,
    initializeQuota,
    clearQuota,
    quotaError
  };
}
