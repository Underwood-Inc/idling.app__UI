'use client';

import { useUserDataBatch } from '@lib/context/UserDataBatchContext';
import { useCallback, useEffect, useState } from 'react';

export interface UseUserDecorationOptions {
  userId?: string;
  forceDecoration?: string;
  refreshTrigger?: unknown; // Generic trigger for refreshing decoration
  enabled?: boolean;
}

export interface UseUserDecorationReturn {
  decoration: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Modern, reusable hook for managing user decorations
 * Uses batching context to reduce API calls
 *
 * @param options Configuration options
 * @returns Decoration state and controls
 */
export function useUserDecoration({
  userId,
  forceDecoration,
  refreshTrigger,
  enabled = true
}: UseUserDecorationOptions): UseUserDecorationReturn {
  const [decoration, setDecoration] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getUserDecoration: getBatchedDecoration } = useUserDataBatch();

  const fetchDecoration = useCallback(() => {
    if (!enabled || !userId) {
      setDecoration(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (forceDecoration) {
      setDecoration(forceDecoration);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    // Use batched request
    getBatchedDecoration(userId, (result) => {
      setDecoration(result);
      setIsLoading(false);
    });
  }, [userId, forceDecoration, enabled, getBatchedDecoration]);

  // Auto-refresh when dependencies change
  useEffect(() => {
    fetchDecoration();
  }, [fetchDecoration, refreshTrigger]);

  const refresh = useCallback(() => {
    fetchDecoration();
  }, [fetchDecoration]);

  return {
    decoration,
    isLoading,
    error,
    refresh
  };
}
