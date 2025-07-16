import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SubmissionWithReplies } from '../../app/components/submissions-list/types';
import { useSimpleSubmissions } from './submissions/useSimpleSubmissions';
import { useSimpleUrlFilters } from './submissions/useSimpleUrlFilters';

// Keep the same interface for compatibility
export interface UseSubmissionsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  initialFilters?: Array<{ name: string; value: string }>;
  initialUserId?: string;
  includeThreadReplies?: boolean;
  infiniteScroll?: boolean;
}

export interface UseSubmissionsManagerReturn {
  submissions: SubmissionWithReplies[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
  };
  filters: Array<{ name: string; value: string }>;
  isLoading: boolean;
  error: string | null;
  addFilter: (filter: { name: string; value: string }) => void;
  addFilters: (filters: Array<{ name: string; value: string }>) => void;
  removeFilter: (name: string, value?: string) => void;
  removeTag: (name: string, value?: string) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  optimisticUpdateSubmission: (
    submissionId: number,
    updatedSubmission: any
  ) => void;
  optimisticRemoveSubmission: (submissionId: number) => void;
  updateFilter: (oldFilter: any, newFilter: any) => void;
}

/**
 * Submissions manager using URL-first architecture
 * Keeps the same interface as the old manager for compatibility
 */
export function useSubmissionsManager({
  contextId,
  onlyMine = false,
  initialFilters = [],
  initialUserId = '',
  includeThreadReplies = false,
  infiniteScroll = false
}: UseSubmissionsManagerProps): UseSubmissionsManagerReturn {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const initializedRef = useRef(false);
  const initializationAttemptedRef = useRef(false);

  // Use the new URL-first filter system
  const { filters, addFilter, removeFilter, clearFilters } =
    useSimpleUrlFilters();

  // Use the new simple submissions hook
  const { submissions, isLoading, error, totalRecords, refresh } =
    useSimpleSubmissions({
      filters,
      onlyMine,
      userId: session?.user?.id?.toString() || initialUserId,
      includeThreadReplies,
      enabled: true
    });

  // Initialize filters from props if URL is empty - only once and only if needed
  useEffect(() => {
    // Only initialize once and only if we have initial filters and no current filters
    if (
      !initializedRef.current &&
      !initializationAttemptedRef.current &&
      filters.length === 0 &&
      initialFilters.length > 0
    ) {
      initializationAttemptedRef.current = true;

      // Use setTimeout to avoid initialization during render
      const timer = setTimeout(() => {
        initialFilters.forEach((filter) => {
          addFilter(filter);
        });
        initializedRef.current = true;
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [filters.length, initialFilters.length]); // Only depend on lengths, not the arrays themselves

  // Create pagination object - memoized
  const pagination = useMemo(
    () => ({
      currentPage,
      pageSize,
      totalRecords
    }),
    [currentPage, pageSize, totalRecords]
  );

  // Handle pagination - memoized callbacks
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Handle multiple filters - memoized
  const addFilters = useCallback(
    (newFilters: Array<{ name: string; value: string }>) => {
      newFilters.forEach((filter) => {
        addFilter(filter);
      });
    },
    [addFilter]
  );

  // Alias for removeFilter to match old interface - memoized
  const removeTag = useCallback(
    (name: string, value?: string) => {
      removeFilter(name, value);
    },
    [removeFilter]
  );

  // Update filter (remove old, add new) - memoized
  const updateFilter = useCallback(
    (oldFilter: any, newFilter: any) => {
      removeFilter(oldFilter.name, oldFilter.value);
      addFilter(newFilter);
    },
    [removeFilter, addFilter]
  );

  // Infinite scroll handlers - memoized
  const loadMore = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const isLoadingMore = false;
  const hasMore = currentPage * pageSize < totalRecords;

  // Optimistic updates - memoized
  const optimisticUpdateSubmission = useCallback(
    (submissionId: number, updatedSubmission: any) => {
      refresh();
    },
    [refresh]
  );

  const optimisticRemoveSubmission = useCallback(
    (submissionId: number) => {
      refresh();
    },
    [refresh]
  );

  return {
    submissions,
    pagination,
    filters,
    isLoading,
    error,
    addFilter,
    addFilters,
    removeFilter,
    removeTag,
    clearFilters,
    setPage,
    setPageSize: handleSetPageSize,
    loadMore,
    isLoadingMore,
    hasMore,
    optimisticUpdateSubmission,
    optimisticRemoveSubmission,
    updateFilter
  };
}
