import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QuotaState } from '../types/generation';

export function useQuotaTracking(): QuotaState & {
  updateQuota: (remaining: number, limit?: number, resetDate?: Date | null) => void;
  initializeQuota: () => Promise<void>;
  clearQuota: () => void;
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
  const isInitializedRef = useRef<boolean>(false);

  // Don't show quota exceeded until we've actually initialized
  const isQuotaExceeded = hasInitializedQuota && remainingGenerations <= 0;

  const updateQuota = useCallback((remaining: number, limit?: number, resetDate?: Date | null) => {
    setRemainingGenerations(remaining);
    if (limit !== undefined) {
      setQuotaLimit(limit);
    }
    if (resetDate !== undefined) {
      setResetDate(resetDate);
    }
    setHasInitializedQuota(true);
  }, []);

  const clearQuota = useCallback(() => {
    setRemainingGenerations(0);
    setQuotaLimit(0);
    setHasInitializedQuota(false);
    setResetDate(null);
    setQuotaError(undefined);
    isInitializedRef.current = false;
  }, []);

  const initializeQuota = useCallback(async () => {
    try {
      setQuotaError(undefined); // Clear previous errors
      
      // Don't make API calls if user is not authenticated
      const session = await fetch('/api/auth/session').then(r => r.json()).catch(() => null);
      if (!session?.user?.id) {
        // Set defaults for unauthenticated users
        updateQuota(0, 0, null);
        return;
      }
      
      // NEVER cache quota data - add cache-busting parameters and headers
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const url = `/api/og-image?format=json&dry-run=true&_t=${cacheBuster}&_nocache=true`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cache-Bust': cacheBuster
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.remainingGenerations !== undefined && data.quotaLimit !== undefined) {
          // Extract quota limit and reset date from the response
          const limit = data.quotaLimit || data.quota_limit;
          const resetDateValue = data.resetDate || data.reset_date ? new Date(data.resetDate || data.reset_date) : null;
          updateQuota(data.remainingGenerations, limit, resetDateValue);
          isInitializedRef.current = true;
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
    
    // No fallback - if quota loading fails, leave in uninitialized state
    console.warn('Quota initialization failed - leaving in uninitialized state');
  }, [updateQuota]);

  // Initialize quota when session is ready and we have a stable auth state
  useEffect(() => {
    // Only initialize if session is loaded and we haven't initialized yet
    if (status === 'loading') return;

    const currentUserId = session?.user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Check if this is the initial mount or if auth state has changed
    const authStateChanged = currentUserId !== previousUserId;
    const isInitialMount = !isInitializedRef.current;

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
      
      // Initialize quota with current auth state
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