'use client';

import { getUserDecoration } from '@lib/actions/subscription.actions';
import { useCallback, useEffect, useState, useTransition } from 'react';

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
  const [isPending, startTransition] = useTransition();

  const fetchDecoration = useCallback(async () => {
    if (!enabled || !userId) {
      setDecoration(null);
      setError(null);
      return;
    }

    if (forceDecoration) {
      setDecoration(forceDecoration);
      setError(null);
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await getUserDecoration(userId);

        if (result.error) {
          setError(result.error);
          setDecoration(null);
        } else {
          setDecoration(result.decoration);
          setError(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load decoration';
        console.error('Failed to fetch user decoration:', err);
        setError(errorMessage);
        setDecoration(null);
      }
    });
  }, [userId, forceDecoration, enabled]);

  // Auto-refresh when dependencies change
  useEffect(() => {
    fetchDecoration();
  }, [fetchDecoration, refreshTrigger]);

  const refresh = useCallback(() => {
    fetchDecoration();
  }, [fetchDecoration]);

  return {
    decoration,
    isLoading: isPending,
    error,
    refresh
  };
}
