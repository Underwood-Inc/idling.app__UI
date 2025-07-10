import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SubmissionWithReplies, getSubmissionsAction } from '../../../app/components/submissions-list/actions';
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
      .map(f => `${f.name}:${f.value}`)
      .sort()
      .join('|');
    return `${sortedFilters}|${onlyMine}|${userId}|${includeThreadReplies}|${enabled}`;
  }, [filters, onlyMine, userId, includeThreadReplies, enabled]);

  const fetchSubmissions = useCallback(async (force = false) => {
    if (!enabled) return;
    
    // Prevent duplicate fetches unless forced
    if (!force && (isFetchingRef.current || lastFetchKeyRef.current === filtersKey)) {
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchKeyRef.current = filtersKey;
    setIsLoading(true);
    setError(null);

    try {
      // Convert filters to API format
      const apiFilters = filters.map(f => ({
        name: f.name,
        value: f.value
      }));

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
      } else {
        setSubmissions([]);
        setTotalRecords(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmissions([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters, onlyMine, userId, includeThreadReplies, enabled, filtersKey]);

  // Fetch data when filtersKey changes - use stable key
  useEffect(() => {
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