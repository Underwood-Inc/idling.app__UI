import { createLogger } from '@lib/logging';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getSubmissionsWithReplies } from '../../../app/components/submissions-list/actions';
import { PostFilters } from '../../types/filters';
import { Filter, SubmissionsFilters, SubmissionsState } from '../atoms';

const logger = createLogger({
  context: {
    component: 'useSubmissionsFetch',
    module: 'state'
  },
  enabled: true
});

interface UseSubmissionsFetchProps {
  filtersState: SubmissionsFilters;
  setSubmissionsState: (stateOrUpdater: SubmissionsState | ((prevState: SubmissionsState) => SubmissionsState)) => void;
  onlyMine: boolean;
  userId: string;
  includeThreadReplies: boolean;
  infiniteScroll: boolean;
  setInfiniteData: (data: any[]) => void;
  setInfinitePage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
}

export function useSubmissionsFetch({
  filtersState,
  setSubmissionsState,
  onlyMine,
  userId,
  includeThreadReplies,
  infiniteScroll,
  setInfiniteData,
  setInfinitePage,
  setHasMore
}: UseSubmissionsFetchProps) {
  const isFetching = useRef(false);
  const lastFetchKey = useRef<string>('');
  const currentFiltersStateRef = useRef(filtersState);

  // Update ref when filtersState changes
  useEffect(() => {
    currentFiltersStateRef.current = filtersState;
  }, [filtersState]);

  // Create a stable fetch key to prevent unnecessary re-renders
  const fetchKey = useMemo(() => {
    return JSON.stringify({
      filters: filtersState.filters,
      page: filtersState.page,
      pageSize: filtersState.pageSize,
      onlyMine,
      userId,
      includeThreadReplies,
      initialized: filtersState.initialized
    });
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized,
    onlyMine,
    userId,
    includeThreadReplies
  ]);

  // Simple fetch function with stable dependencies
  const fetchSubmissions = useCallback(async () => {
    const currentFilters = currentFiltersStateRef.current;
    if (!currentFilters.initialized) {
      return;
    }

    // Create fetch key at execution time to avoid dependency issues
    const executionFetchKey = JSON.stringify({
      filters: currentFilters.filters,
      page: currentFilters.page,
      pageSize: currentFilters.pageSize,
      onlyMine,
      userId,
      includeThreadReplies,
      initialized: currentFilters.initialized
    });

    logger.group('fetchSubmissions');
    logger.debug('fetchSubmissions called', {
      fetchKey: executionFetchKey.substring(0, 100) + '...',
      lastFetchKey: lastFetchKey.current.substring(0, 100) + '...',
      isSameFetch: lastFetchKey.current === executionFetchKey,
      filtersCount: currentFilters.filters.length,
      page: currentFilters.page
    });

    // Skip if this exact same fetch was already done
    if (lastFetchKey.current === executionFetchKey) {
      logger.debug('Skipping duplicate fetch');
      logger.groupEnd();
      return;
    }

    // If already fetching a different request, wait for it to complete
    if (isFetching.current) {
      logger.debug('Already fetching different request, will retry');
      logger.groupEnd();
      // Schedule retry after current fetch completes
      setTimeout(() => fetchSubmissions(), 100);
      return;
    }

    lastFetchKey.current = executionFetchKey;
    isFetching.current = true;

    logger.debug('Starting fetch with filters', {
      filters: currentFilters.filters,
      page: currentFilters.page,
      pageSize: currentFilters.pageSize
    });

    // Set loading state at the start of fetch
    setSubmissionsState((prevState: SubmissionsState) => ({
      ...prevState,
      loading: true
    }));

    // Safety timeout to prevent stuck loading state
    const loadingTimeout = setTimeout(() => {
      if (isFetching.current) {
        logger.warn('Fetch timeout - resetting loading state', {
          fetchKey: executionFetchKey.substring(0, 100) + '...',
          filters: currentFilters.filters
        });
        setSubmissionsState((prevState: SubmissionsState) => ({
          ...prevState,
          loading: false,
          error: 'Request timed out. Please try again.'
        }));
        isFetching.current = false;
      }
    }, 30000); // 30 second timeout

    try {
      const result = await getSubmissionsWithReplies({
        filters: currentFilters.filters as Filter<PostFilters>[],
        page: currentFilters.page,
        pageSize: currentFilters.pageSize,
        onlyMine,
        userId,
        includeThreadReplies
      });

      if (result.data) {
        const submissionsData = result.data.data || [];
        
        // Debug logging for search results issue
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('🔍 useSubmissionsFetch - Fetch Result:', {
            submissionsCount: submissionsData.length,
            totalRecords: result.data.pagination?.totalRecords || 0,
            filters: currentFilters.filters,
            page: currentFilters.page,
            firstSubmission: submissionsData[0] ? {
              id: submissionsData[0].submission_id,
              title: submissionsData[0].submission_title,
              author: submissionsData[0].author
            } : null
          });
        }
        
        setSubmissionsState({
          loading: false,
          data: {
            submissions: submissionsData,
            pagination: result.data.pagination || {
              currentPage: currentFilters.page,
              pageSize: currentFilters.pageSize,
              totalRecords: 0
            }
          },
          error: undefined
        });

        // Initialize infinite scroll data on first load
        if (infiniteScroll && currentFilters.page === 1) {
          setInfiniteData(result.data.data || []);
          setInfinitePage(1);
          setHasMore((result.data.data?.length || 0) === currentFilters.pageSize);
        }
      } else {
        setSubmissionsState({
          loading: false,
          data: undefined,
          error: result.error || 'Failed to fetch submissions'
        });
      }
      logger.groupEnd();
    } catch (error: unknown) {
      logger.error('Error in useSubmissionsFetch', error as Error, {
        filters: currentFilters.filters,
        page: currentFilters.page,
        onlyMine,
        userId
      });
      setSubmissionsState((prevState: SubmissionsState) => ({
        ...prevState,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch submissions'
      }));
      logger.groupEnd();
    } finally {
      clearTimeout(loadingTimeout);
      isFetching.current = false;
    }
  }, [
    // Remove fetchKey from dependencies - calculate it at execution time instead
    onlyMine,
    userId,
    includeThreadReplies,
    infiniteScroll,
    setSubmissionsState,
    setInfiniteData,
    setInfinitePage,
    setHasMore
  ]);

  // Simple fetch when filters change - use stable fetchKey
  useEffect(() => {
    if (!filtersState.initialized) {
      // Debug logging for skipped fetch
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 Fetch Skipped - Not Initialized:', {
          initialized: filtersState.initialized,
          fetchKey: fetchKey.substring(0, 100) + '...'
        });
      }
      return;
    }

    // Debug logging for triggered fetch
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('🔍 Triggering Fetch:', {
        fetchKey: fetchKey.substring(0, 100) + '...',
        filters: filtersState.filters,
        page: filtersState.page,
        isFetching: isFetching.current
      });
    }

    // Always try to fetch - fetchSubmissions handles race conditions internally
    fetchSubmissions();
  }, [fetchKey, fetchSubmissions]);

  const forceRefresh = useCallback(() => {
    // Force a refresh by clearing the lastFetchKey to bypass duplicate fetch check
    lastFetchKey.current = '';
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    fetchSubmissions,
    forceRefresh
  };
} 