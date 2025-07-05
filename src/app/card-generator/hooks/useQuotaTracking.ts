import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { QuotaState } from '../types/generation';

export function useQuotaTracking(): QuotaState & {
  updateQuota: (remaining: number, limit?: number, resetDate?: Date | null) => void;
  initializeQuota: () => Promise<void>;
  quotaError?: string;
} {
  const { data: session, status } = useSession();
  const [remainingGenerations, setRemainingGenerations] = useState<number>(0);
  const [quotaLimit, setQuotaLimit] = useState<number>(0);
  const [hasInitializedQuota, setHasInitializedQuota] = useState<boolean>(false);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [quotaError, setQuotaError] = useState<string | undefined>(undefined);
  
  // Track previous auth state to detect changes
  const previousUserIdRef = useRef<string | null>(null);

  // Don't show quota exceeded until we've actually initialized
  const isQuotaExceeded = hasInitializedQuota && remainingGenerations <= 0;

  const updateQuota = (remaining: number, limit?: number, resetDate?: Date | null) => {
    setRemainingGenerations(remaining);
    if (limit !== undefined) {
      setQuotaLimit(limit);
    }
    if (resetDate !== undefined) {
      setResetDate(resetDate);
    }
    setHasInitializedQuota(true);
  };

  const initializeQuota = async () => {
    try {
      setQuotaError(undefined); // Clear previous errors
      const response = await fetch('/api/og-image?format=json&dry-run=true', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.remainingGenerations !== undefined && data.quotaLimit !== undefined) {
          // Extract quota limit and reset date from the response
          const limit = data.quotaLimit || data.quota_limit;
          const resetDateValue = data.resetDate || data.reset_date ? new Date(data.resetDate || data.reset_date) : null;
          updateQuota(data.remainingGenerations, limit, resetDateValue);
          return; // Success - exit early
        } else {
          console.error('Quota data missing from API response:', data);
          setQuotaError('Quota data missing from API response');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API request failed:', response.status, errorData);
        setQuotaError(`API request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to initialize quota:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setQuotaError(`Unable to load quota information: ${errorMessage}`);
    }
    
    // Fallback: Always provide working quota values even if API fails
    // This ensures the UI never breaks - user gets reasonable defaults
    console.warn('Using fallback quota values due to API failure');
    updateQuota(1, 1, new Date(Date.now() + 86400000)); // 1 generation, resets tomorrow
  };

  // Auto-initialize on mount
  useEffect(() => {
    initializeQuota().catch(console.error);
  }, []);

  // Monitor auth state changes and refresh quota when auth changes
  useEffect(() => {
    // Skip if session is still loading
    if (status === 'loading') return;

    const currentUserId = session?.user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Check if auth state has changed (login, logout, or user switch)
    const authStateChanged = currentUserId !== previousUserId;

    if (authStateChanged) {
      // Reset quota state and reinitialize
      setHasInitializedQuota(false);
      setRemainingGenerations(0);
      setQuotaLimit(0);
      setResetDate(null);
      setQuotaError(undefined);
      
      // Reinitialize quota with new auth state
      initializeQuota().catch(console.error);

      // Update the ref for next comparison
      previousUserIdRef.current = currentUserId;
    }
  }, [session?.user?.id, status]);

  return {
    remainingGenerations,
    quotaLimit,
    hasInitializedQuota,
    isQuotaExceeded,
    resetDate,
    updateQuota,
    initializeQuota,
    quotaError
  };
} 