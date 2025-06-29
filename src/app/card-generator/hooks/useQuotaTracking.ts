import { useEffect, useState } from 'react';
import { QuotaState } from '../types/generation';

export function useQuotaTracking(): QuotaState & {
  updateQuota: (remaining: number) => void;
  initializeQuota: () => Promise<void>;
} {
  const [remainingGenerations, setRemainingGenerations] = useState<number>(1);
  const [hasInitializedQuota, setHasInitializedQuota] = useState<boolean>(false);

  const isQuotaExceeded = remainingGenerations <= 0;

  const updateQuota = (remaining: number) => {
    setRemainingGenerations(remaining);
    setHasInitializedQuota(true);
  };

  const initializeQuota = async () => {
    if (hasInitializedQuota) return;

    try {
      const response = await fetch('/api/og-image?format=json&dry-run=true');
      if (response.ok) {
        const data = await response.json();
        if (data.remainingGenerations !== undefined) {
          updateQuota(data.remainingGenerations);
        }
      }
    } catch (error) {
      // Continue with default
      setHasInitializedQuota(true);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    initializeQuota();
  }, []);

  return {
    remainingGenerations,
    hasInitializedQuota,
    isQuotaExceeded,
    updateQuota,
    initializeQuota
  };
} 