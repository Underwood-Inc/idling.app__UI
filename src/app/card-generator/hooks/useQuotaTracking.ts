import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { QuotaState } from '../types/generation';

export function useQuotaTracking(): QuotaState & {
  updateQuota: (remaining: number, limit?: number, resetDate?: Date | null) => void;
  initializeQuota: () => Promise<void>;
} {
  const { data: session, status } = useSession();
  const [remainingGenerations, setRemainingGenerations] = useState<number>(1);
  const [quotaLimit, setQuotaLimit] = useState<number>(1);
  const [hasInitializedQuota, setHasInitializedQuota] = useState<boolean>(false);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  
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
      const response = await fetch('/api/og-image?format=json&dry-run=true', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.remainingGenerations !== undefined) {
          // Extract quota limit and reset date from the response if available
          const limit = data.quotaLimit || data.quota_limit || 1; // Default to 1 if no limit provided
          const resetDateValue = data.resetDate || data.reset_date ? new Date(data.resetDate || data.reset_date) : null;
          updateQuota(data.remainingGenerations, limit, resetDateValue);
        } else {
          // If no quota data, assume user has quota available
          setRemainingGenerations(1);
          setQuotaLimit(1);
          setResetDate(null);
          setHasInitializedQuota(true);
        }
      } else {
        // If API fails, assume user has quota available
        setRemainingGenerations(1);
        setQuotaLimit(1);
        setResetDate(null);
        setHasInitializedQuota(true);
      }
    } catch (error) {
      // On error, assume user has quota available
      console.warn('Failed to initialize quota, assuming quota available:', error);
      setRemainingGenerations(1);
      setQuotaLimit(1);
      setResetDate(null);
      setHasInitializedQuota(true);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    initializeQuota();
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
      setRemainingGenerations(1);
      setQuotaLimit(1);
      setResetDate(null);
      
      // Reinitialize quota with new auth state
      initializeQuota();

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
    initializeQuota
  };
} 