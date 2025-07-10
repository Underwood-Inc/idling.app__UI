import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubmissionWithReplies } from '../../app/components/submissions-list/actions';
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
  optimisticUpdateSubmission: (submissionId: number, updatedSubmission: any) => void;
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

  // Use the new URL-first filter system
  const { filters, addFilter, removeFilter, clearFilters } = useSimpleUrlFilters();

  // Use the new simple submissions hook
  const { submissions, isLoading, error, totalRecords, refresh } = useSimpleSubmissions({
    filters,
    onlyMine,
    userId: session?.user?.id?.toString() || initialUserId,
    includeThreadReplies,
    enabled: true
  });

  // Initialize filters from props if URL is empty
  useEffect(() => {
    if (filters.length === 0 && initialFilters.length > 0) {
      initialFilters.forEach(filter => {
        addFilter(filter);
      });
    }
  }, [initialFilters, filters.length, addFilter]);

  // Create pagination object
  const pagination = useMemo(() => ({
    currentPage,
    pageSize,
    totalRecords
  }), [currentPage, pageSize, totalRecords]);

  // Handle pagination (simplified for now)
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Handle multiple filters
  const addFilters = useCallback((newFilters: Array<{ name: string; value: string }>) => {
    newFilters.forEach(filter => {
      addFilter(filter);
    });
  }, [addFilter]);

  // Alias for removeFilter to match old interface
  const removeTag = useCallback((name: string, value?: string) => {
    removeFilter(name, value);
  }, [removeFilter]);

  // Update filter (remove old, add new)
  const updateFilter = useCallback((oldFilter: any, newFilter: any) => {
    removeFilter(oldFilter.name, oldFilter.value);
    addFilter(newFilter);
  }, [removeFilter, addFilter]);

  // Infinite scroll handlers (simplified)
  const loadMore = useCallback(() => {
    // For now, just increment page
    setCurrentPage(prev => prev + 1);
  }, []);

  const isLoadingMore = false; // Simplified
  const hasMore = currentPage * pageSize < totalRecords;

  // Optimistic updates (simplified)
  const optimisticUpdateSubmission = useCallback((submissionId: number, updatedSubmission: any) => {
    // For now, just refresh - could implement optimistic updates later
    refresh();
  }, [refresh]);

  const optimisticRemoveSubmission = useCallback((submissionId: number) => {
    // For now, just refresh - could implement optimistic updates later
    refresh();
  }, [refresh]);

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
