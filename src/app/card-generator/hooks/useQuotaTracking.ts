import { useEffect, useState } from 'react';
import { QuotaState } from '../types/generation';

export function useQuotaTracking(): QuotaState & {
  updateQuota: (remaining: number, limit?: number) => void;
  initializeQuota: () => Promise<void>;
} {
  const [remainingGenerations, setRemainingGenerations] = useState<number>(1);
  const [quotaLimit, setQuotaLimit] = useState<number>(1);
  const [hasInitializedQuota, setHasInitializedQuota] = useState<boolean>(false);

  // Don't show quota exceeded until we've actually initialized
  const isQuotaExceeded = hasInitializedQuota && remainingGenerations <= 0;

  const updateQuota = (remaining: number, limit?: number) => {
    setRemainingGenerations(remaining);
    if (limit !== undefined) {
      setQuotaLimit(limit);
    }
    setHasInitializedQuota(true);
  };

  const initializeQuota = async () => {
    if (hasInitializedQuota) return;

    try {
      const response = await fetch('/api/og-image?format=json&dry-run=true');
      if (response.ok) {
        const data = await response.json();
        if (data.remainingGenerations !== undefined) {
          // Extract quota limit from the response if available
          const limit = data.quotaLimit || data.quota_limit || (data.remainingGenerations + 1);
          updateQuota(data.remainingGenerations, limit);
        } else {
          // If no quota data, assume user has quota available
          setRemainingGenerations(1);
          setQuotaLimit(1);
          setHasInitializedQuota(true);
        }
      } else {
        // If API fails, assume user has quota available
        setRemainingGenerations(1);
        setQuotaLimit(1);
        setHasInitializedQuota(true);
      }
    } catch (error) {
      // On error, assume user has quota available
      console.warn('Failed to initialize quota, assuming quota available:', error);
      setRemainingGenerations(1);
      setQuotaLimit(1);
      setHasInitializedQuota(true);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    initializeQuota();
  }, []);

  return {
    remainingGenerations,
    quotaLimit,
    hasInitializedQuota,
    isQuotaExceeded,
    updateQuota,
    initializeQuota
  };
} 