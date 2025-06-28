import { createLogger } from '@/lib/logging';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import {
  getSubmissionsFiltersAtom,
  getSubmissionsStateAtom,
  shouldUpdateAtom
} from './atoms';
import { UseSubmissionsManagerProps } from './submissions/types';
import { useFiltersManager } from './submissions/useFiltersManager';
import { useInfiniteScroll } from './submissions/useInfiniteScroll';
import { useOptimisticUpdates } from './submissions/useOptimisticUpdates';
import { useSubmissionsFetch } from './submissions/useSubmissionsFetch';
import { useUrlSync } from './submissions/useUrlSync';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'useSubmissionsManager',
    module: 'state'
  },
  enabled: true // Enabled to debug race condition
});

export function useSubmissionsManager({
  contextId,
  onlyMine = false,
  initialFilters = [],
  initialUserId,
  includeThreadReplies = false,
  infiniteScroll = false
}: UseSubmissionsManagerProps) {
  const { data: session } = useSession();

  // Use simple atoms without circular dependencies
  const [submissionsState, setSubmissionsState] = useAtom(
    getSubmissionsStateAtom(contextId)
  );
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );
  const [shouldUpdate, setShouldUpdate] = useAtom(shouldUpdateAtom);

  // User ID with session fallback (internal database ID)
  const userId = useMemo(() => {
    return initialUserId || session?.user?.id || '';
  }, [initialUserId, session?.user?.id]);

  // Initialize infinite scroll hook
  const {
    infiniteData,
    setInfiniteData,
    infinitePage,
    setInfinitePage,
    isLoadingMore,
    hasMore,
    setHasMore,
    loadMore
  } = useInfiniteScroll({
    infiniteScroll,
    filtersState,
    submissionsState,
    onlyMine,
    userId,
    includeThreadReplies
  });

  // Initialize URL sync hook
  useUrlSync({
    filtersState,
    setFiltersState,
    initialFilters,
    infiniteScroll
  });

  // Initialize data fetching hook
  const { forceRefresh } = useSubmissionsFetch({
    filtersState,
    setSubmissionsState,
    onlyMine,
    userId,
    includeThreadReplies,
    infiniteScroll,
    setInfiniteData,
    setInfinitePage,
    setHasMore
  });

  // Initialize filters management hook
  const {
    addFilter,
    addFilters,
    removeFilter,
    removeTag,
    setPage,
    setPageSize,
    clearFilters,
    updateFilter
  } = useFiltersManager({
    setFiltersState,
    infiniteScroll,
    setInfiniteData,
    setInfinitePage,
    setHasMore
  });

  // Initialize optimistic updates hook
  const { optimisticUpdateSubmission, optimisticRemoveSubmission } =
    useOptimisticUpdates({
      submissionsState,
      setSubmissionsState,
      infiniteScroll,
      infiniteData,
      setInfiniteData
    });

  // Listen for shouldUpdate changes (edit/delete operations)
  useEffect(() => {
    if (shouldUpdate) {
      logger.debug('Received shouldUpdate signal, forcing refresh');
      
      // Reset the shouldUpdate flag first
      setShouldUpdate(false);

      // Trigger a fresh fetch
      forceRefresh();
    }
  }, [shouldUpdate, setShouldUpdate, forceRefresh]);

  // Default pagination
  const pagination = useMemo(
    () => ({
      currentPage: filtersState.page,
      pageSize: filtersState.pageSize,
      totalRecords: submissionsState.data?.pagination?.totalRecords || 0
    }),
    [filtersState.page, filtersState.pageSize]
  );

  return {
    // State
    submissions: submissionsState.data?.submissions || [],
    pagination,
    isLoading: submissionsState.loading,
    error: submissionsState.error,
    filters: filtersState.filters,
    initialized: filtersState.initialized,

    // Infinite scroll
    infiniteData,
    hasMore,
    isLoadingMore,
    loadMore,

    // Actions
    addFilter,
    addFilters,
    removeFilter,
    removeTag,
    setPage,
    setPageSize,
    clearFilters,
    updateFilter,

    // Optimistic updates
    optimisticUpdateSubmission,
    optimisticRemoveSubmission,

    // Computed values
    totalFilters: filtersState.filters.length,
    currentPage: filtersState.page,
    pageSize: filtersState.pageSize
  };
}
