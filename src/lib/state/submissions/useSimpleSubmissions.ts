import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSubmissionsAction } from '../../../app/components/submissions-list/actions';
import { SubmissionWithReplies } from '../../../app/components/submissions-list/types';
import { Filter } from './useSimpleUrlFilters';

export interface UseSimpleSubmissionsProps {
  filters: Filter[];
  onlyMine?: boolean;
  userId?: string;
  includeThreadReplies?: boolean;
  enabled?: boolean;
}

export interface UseSimpleSubmissionsReturn {
  submissions: SubmissionWithReplies[];
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  refresh: () => void;
}

/**
 * Simple submissions data fetching using server actions
 * No complex state management, just fetch data based on filters
 */
export function useSimpleSubmissions({
  filters,
  onlyMine = false,
  userId = '',
  includeThreadReplies = false,
  enabled = true
}: UseSimpleSubmissionsProps): UseSimpleSubmissionsReturn {
  const [submissions, setSubmissions] = useState<SubmissionWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Use ref to track if we're already fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');

  // Create a stable key for the fetch effect - use a more stable approach
  const filtersKey = useMemo(() => {
    const sortedFilters = filters
      .map((f) => `${f.name}:${f.value}`)
      .sort()
      .join('|');
    const key = `${sortedFilters}|${onlyMine}|${userId}|${includeThreadReplies}|${enabled}`;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 useSimpleSubmissions - filtersKey updated:', {
        key: key.substring(0, 100) + (key.length > 100 ? '...' : ''),
        filtersCount: filters.length,
        filters: filters.map((f) => ({ name: f.name, value: f.value }))
      });
    }

    return key;
  }, [filters, onlyMine, userId, includeThreadReplies, enabled]);

  const fetchSubmissions = useCallback(
    async (force = false) => {
      if (!enabled) return;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 fetchSubmissions called:', {
          force,
          filtersKey,
          lastFetchKey: lastFetchKeyRef.current,
          isFetching: isFetchingRef.current,
          filters: filters.map((f) => ({ name: f.name, value: f.value }))
        });
      }

      // Prevent duplicate fetches unless forced
      if (
        !force &&
        (isFetchingRef.current || lastFetchKeyRef.current === filtersKey)
      ) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🔍 fetchSubmissions: skipping duplicate fetch');
        }
        return;
      }

      isFetchingRef.current = true;
      lastFetchKeyRef.current = filtersKey;
      setIsLoading(true);
      setError(null);

      try {
        // Convert filters to API format
        const apiFilters = filters.map((f) => ({
          name: f.name,
          value: f.value
        }));

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🔍 fetchSubmissions: calling API with:', {
            apiFilters,
            onlyMine,
            userId,
            includeThreadReplies
          });
        }

        // Call server action directly
        const response = await getSubmissionsAction({
          onlyMine,
          userId,
          filters: apiFilters,
          page: 1,
          pageSize: 10,
          includeThreadReplies
        });

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setSubmissions(response.data.data || []);
          setTotalRecords(response.data.pagination?.totalRecords || 0);

          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('🔍 fetchSubmissions: success:', {
              submissionsCount: response.data.data?.length || 0,
              totalRecords: response.data.pagination?.totalRecords || 0
            });
          }
        } else {
          setSubmissions([]);
          setTotalRecords(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setSubmissions([]);
        setTotalRecords(0);

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('🔍 fetchSubmissions: error:', err);
        }
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [filters, onlyMine, userId, includeThreadReplies, enabled, filtersKey]
  );

  // Fetch data when filtersKey changes - use stable key
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 useSimpleSubmissions useEffect triggered:', {
        filtersKey:
          filtersKey.substring(0, 100) + (filtersKey.length > 100 ? '...' : ''),
        timestamp: Date.now()
      });
    }

    fetchSubmissions();
  }, [fetchSubmissions]);

  const refresh = useCallback(() => {
    fetchSubmissions(true); // Force refresh
  }, [fetchSubmissions]);

  return {
    submissions,
    isLoading,
    error,
    totalRecords,
    refresh
  };
}
