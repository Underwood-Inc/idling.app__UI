import { createLogger } from '@/lib/logging';
import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getSubmissionsWithReplies,
    SubmissionWithReplies
} from '../../app/components/submissions-list/actions';
import { PostFilters } from '../types/filters';
import {
    Filter,
    getSubmissionsFiltersAtom,
    getSubmissionsStateAtom,
    shouldUpdateAtom
} from './atoms';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'useSubmissionsManager',
    module: 'state'
  },
  enabled: true // Enabled to debug race condition
});

interface UseSubmissionsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  initialFilters?: Filter<PostFilters>[];
  userId?: string; // Internal database user ID only
  includeThreadReplies?: boolean;
  infiniteScroll?: boolean;
}

export function useSubmissionsManager({
  contextId,
  onlyMine = false,
  initialFilters = [],
  userId: initialUserId,
  includeThreadReplies = false,
  infiniteScroll = false
}: UseSubmissionsManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use simple atoms without circular dependencies
  const [submissionsState, setSubmissionsState] = useAtom(
    getSubmissionsStateAtom(contextId)
  );
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );
  const [shouldUpdate, setShouldUpdate] = useAtom(shouldUpdateAtom);

  // Local state for infinite scroll
  const [infiniteData, setInfiniteData] = useState<SubmissionWithReplies[]>([]);
  const [infinitePage, setInfinitePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Refs to prevent loops
  const isInitialized = useRef(false);
  const lastUrlParams = useRef<string>('');
  const isFetching = useRef(false);
  const lastFetchKey = useRef<string>('');
  const isUpdatingUrl = useRef(false); // Flag to prevent circular URL updates
  const fetchEffectCount = useRef(0); // Counter to track fetch effect runs
  const currentFiltersStateRef = useRef(filtersState);

  // Update ref when filtersState changes
  useEffect(() => {
    currentFiltersStateRef.current = filtersState;
  }, [filtersState]);

  // User ID with session fallback (internal database ID)
  const userId = useMemo(() => {
    return initialUserId || session?.user?.id || '';
  }, [initialUserId, session?.user?.id]);

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

    logger.group('fetchSubmissions');
    logger.debug('fetchSubmissions called', {
      fetchKey: fetchKey.substring(0, 100) + '...',
      lastFetchKey: lastFetchKey.current.substring(0, 100) + '...',
      isSameFetch: lastFetchKey.current === fetchKey,
      filtersCount: currentFilters.filters.length,
      page: currentFilters.page
    });

    // Skip if this exact same fetch was already done
    if (lastFetchKey.current === fetchKey) {
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

    lastFetchKey.current = fetchKey;
    isFetching.current = true;

    logger.debug('Starting fetch with filters', {
      filters: currentFilters.filters,
      page: currentFilters.page,
      pageSize: currentFilters.pageSize
    });

    // Set loading state at the start of fetch
    setSubmissionsState(prevState => ({
      ...prevState,
      loading: true
    }));

    // Safety timeout to prevent stuck loading state
    const loadingTimeout = setTimeout(() => {
      if (isFetching.current) {
        logger.warn('Fetch timeout - resetting loading state', {
          fetchKey: fetchKey.substring(0, 100) + '...',
          filters: currentFilters.filters
        });
        setSubmissionsState(prevState => ({
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
          console.log('🔍 useSubmissionsManager - Fetch Result:', {
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
      logger.error('Error in useSubmissionsManager', error as Error, {
        filters: currentFilters.filters,
        page: currentFilters.page,
        onlyMine,
        userId
      });
      setSubmissionsState((prevState) => ({
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
    filtersState.initialized,
    onlyMine,
    userId,
    includeThreadReplies,
    infiniteScroll,
    setSubmissionsState
  ]);

  // Initialize from URL once
  // Initialize filters from URL ONCE on mount only
  useEffect(() => {
    if (filtersState.initialized) {
      return;
    }

    // Parse URL parameters into filters (one-time only)
    const urlFilters: Filter<PostFilters>[] = [];

    // Parse tags - create separate filters for each tag
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tags = tagsParam.split(',').filter(Boolean);
      tags.forEach(tag => {
        urlFilters.push({ name: 'tags', value: tag.trim() });
      });
    }

    // Parse other filters
    const authorParam = searchParams.get('author');
    if (authorParam) urlFilters.push({ name: 'author', value: authorParam });

    const globalLogicParam = searchParams.get('globalLogic');
    if (globalLogicParam) urlFilters.push({ name: 'globalLogic', value: globalLogicParam });

    const tagLogicParam = searchParams.get('tagLogic');
    if (tagLogicParam) urlFilters.push({ name: 'tagLogic', value: tagLogicParam });

    // Use URL filters if available, otherwise use initial filters
    const finalFilters = urlFilters.length > 0 ? urlFilters : initialFilters;
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    setFiltersState((prevState) => ({
      ...prevState,
      filters: finalFilters,
      page,
      initialized: true
    }));

    isInitialized.current = true;
  }, [filtersState.initialized, initialFilters, searchParams, setFiltersState]);

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

  // Listen for shouldUpdate changes (edit/delete operations)
  useEffect(() => {
    if (shouldUpdate) {
      // Reset the shouldUpdate flag first
      setShouldUpdate(false);

      // Force a refresh by clearing the lastFetchKey to bypass duplicate fetch check
      lastFetchKey.current = '';

      // Trigger a fresh fetch
      fetchSubmissions();
    }
  }, [shouldUpdate, setShouldUpdate, fetchSubmissions]);

  // Memoize URL params to prevent unnecessary URL updates
  const urlParams = useMemo(() => {
    if (!filtersState.initialized || infiniteScroll) return null;

    const params = new URLSearchParams();

    // Group filters by type
    const filterGroups: Record<string, string[]> = {};
    filtersState.filters.forEach((filter) => {
      if (!filterGroups[filter.name]) {
        filterGroups[filter.name] = [];
      }
      filterGroups[filter.name].push(filter.value);
    });

    // Add tags (combine multiple tag filters, remove # prefix)
    if (filterGroups.tags && filterGroups.tags.length > 0) {
      const tagsForUrl = filterGroups.tags.map(tag => 
        tag.startsWith('#') ? tag.slice(1) : tag
      );
      params.set('tags', tagsForUrl.join(','));
    }

    // Add other filters
    Object.entries(filterGroups).forEach(([name, values]) => {
      if (name === 'tags') return; // Already handled
      if (values.length > 0) {
        params.set(name, values[0]); // Use first value for logic filters
      }
    });

    // Add page if not 1
    if (filtersState.page > 1) {
      params.set('page', filtersState.page.toString());
    }

    return params.toString();
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.initialized,
    infiniteScroll
  ]);

  // One-way URL sync: filters → URL (never URL → filters after init)
  useEffect(() => {
    if (urlParams === null) return;

    // Build new URL
    const newUrl = `${pathname}${urlParams ? `?${urlParams}` : ''}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // Only update URL if it changed
    if (newUrl !== currentUrl) {
      router.replace(newUrl); // Use replace to avoid history pollution
    }
  }, [urlParams, pathname, router, searchParams]);

  // Simple action functions
  const addFilter = useCallback(
    (filter: Filter<PostFilters>) => {
      setFiltersState((prevState) => ({
        ...prevState,
        filters: [...prevState.filters, filter],
        page: 1
      }));
    },
    [setFiltersState]
  );

  const addFilters = useCallback(
    (filters: Filter<PostFilters>[]) => {
      setFiltersState((prevState) => ({
        ...prevState,
        filters: [...prevState.filters, ...filters],
        page: 1
      }));
    },
    [setFiltersState]
  );

  const removeFilter = useCallback(
    (filterName: PostFilters, filterValue?: string) => {
      setFiltersState((prevState) => {
        const newFilters = prevState.filters
          .map((filter) => {
            if (filter.name === filterName) {
              if (!filterValue) {
                // Remove entire filter if no specific value provided
                return null;
              }

              // Handle comma-separated values for author/mentions filters
              if (filterName === 'author' || filterName === 'mentions') {
                const currentValues = filter.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean);

                const updatedValues = currentValues.filter(
                  (value) => value !== filterValue
                );

                if (updatedValues.length === 0) {
                  return null; // Remove the entire filter
                }

                return {
                  ...filter,
                  value: updatedValues.join(',')
                };
              } else {
                // For other filter types, use exact match
                return filter.value === filterValue ? null : filter;
              }
            }
            return filter;
          })
          .filter((filter): filter is Filter<PostFilters> => filter !== null);

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      // Check if this is a special search text removal format: "search:removedTerm:newSearchText"
      if (tagToRemove.startsWith('search:')) {
        const parts = tagToRemove.split(':');
        if (parts.length === 3) {
          const [, removedTerm, newSearchText] = parts;
          
          setFiltersState((prevState) => {
            const newFilters = prevState.filters.map((filter) => {
              if (filter.name === 'search') {
                return {
                  ...filter,
                  value: newSearchText
                };
              }
              return filter;
            });

            return {
              ...prevState,
              filters: newFilters,
              page: 1
            };
          });
          return;
        }
      }

      setFiltersState((prevState) => {
        const newFilters = prevState.filters
          .map((filter) => {
            if (filter.name === 'tags') {
              const currentTags = filter.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

              // Handle both formats: with and without # prefix
              // Try to match the tag as-is first, then try with/without # prefix
              const tagVariants = [
                tagToRemove,
                tagToRemove.startsWith('#')
                  ? tagToRemove.slice(1)
                  : `#${tagToRemove}`
              ];

              const updatedTags = currentTags.filter(
                (tag) => !tagVariants.includes(tag)
              );

              if (updatedTags.length === 0) {
                return null; // Remove the entire filter
              }

              return {
                ...filter,
                value: updatedTags.join(',')
              };
            }
            return filter;
          })
          .filter((filter): filter is Filter<PostFilters> => filter !== null);

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const setPage = useCallback(
    (page: number) => {
      setFiltersState((prevState) => ({
        ...prevState,
        page
      }));
    },
    [setFiltersState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      setFiltersState((prevState) => ({
        ...prevState,
        pageSize,
        page: 1
      }));
    },
    [setFiltersState]
  );

  const clearFilters = useCallback(() => {
    setFiltersState((prevState) => ({
      ...prevState,
      filters: [],
      page: 1
    }));

    if (infiniteScroll) {
      setInfiniteData([]);
      setInfinitePage(1);
      setHasMore(true);
    }
  }, [setFiltersState, infiniteScroll]);

  // Infinite scroll load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || submissionsState.loading) return;

    setIsLoadingMore(true);
    try {
      const nextPage = infinitePage + 1;
      const result = await getSubmissionsWithReplies({
        filters: filtersState.filters as Filter<PostFilters>[],
        page: nextPage,
        pageSize: filtersState.pageSize,
        onlyMine,
        userId,
        includeThreadReplies
      });

      if (result.data?.data) {
        const newData = result.data.data;
        setInfiniteData((prev) => [...prev, ...newData]);
        setInfinitePage(nextPage);
        setHasMore(newData.length === filtersState.pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      logger.error('Error loading more submissions', error as Error, {
        isLoadingMore,
        hasMore,
        submissionsStateLoading: submissionsState.loading,
        infinitePage,
        filtersStateFilters: filtersState.filters,
        filtersStatePageSize: filtersState.pageSize,
        onlyMine,
        userId,
        includeThreadReplies
      });
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    submissionsState.loading,
    infinitePage,
    filtersState.filters,
    filtersState.pageSize,
    onlyMine,
    userId,
    includeThreadReplies
  ]);

  // Initialize infinite scroll data when switching modes or when regular data loads
  useEffect(() => {
    if (infiniteScroll && submissionsState.data?.submissions) {
      // If we're in infinite scroll mode but don't have infinite data, initialize it
      if (
        infiniteData.length === 0 &&
        submissionsState.data.submissions.length > 0
      ) {
        setInfiniteData(submissionsState.data.submissions);
        setInfinitePage(filtersState.page);
        setHasMore(
          submissionsState.data.submissions.length === filtersState.pageSize
        );
      }
    }
  }, [
    infiniteScroll,
    submissionsState.data?.submissions,
    infiniteData.length,
    filtersState.page,
    filtersState.pageSize
  ]);

  // Reset infinite scroll state when switching to paged mode
  useEffect(() => {
    if (!infiniteScroll) {
      setInfiniteData([]);
      setInfinitePage(1);
      setHasMore(true);
    }
  }, [infiniteScroll]);

  // Default pagination
  const defaultPagination = useMemo(
    () => ({
      currentPage: filtersState.page,
      pageSize: filtersState.pageSize,
      totalRecords: 0
    }),
    [filtersState.page, filtersState.pageSize]
  );

  // Optimistic update functions
  const optimisticUpdateSubmission = useCallback(
    (submissionId: number, updatedSubmission: any) => {
      const currentState = submissionsState;
      if (currentState.data) {
        const updatedSubmissions = currentState.data.submissions.map(
          (submission) =>
            submission.submission_id === submissionId
              ? { ...submission, ...updatedSubmission }
              : submission
        );

        setSubmissionsState({
          ...currentState,
          data: {
            submissions: updatedSubmissions,
            pagination: currentState.data.pagination
          }
        });
      }
    },
    [submissionsState, setSubmissionsState]
  );

  const optimisticRemoveSubmission = useCallback(
    (submissionId: number) => {
      const currentState = submissionsState;
      if (currentState.data) {
        const updatedSubmissions = currentState.data.submissions.filter(
          (submission) => submission.submission_id !== submissionId
        );
        const updatedPagination = {
          ...currentState.data.pagination,
          totalRecords: Math.max(
            0,
            currentState.data.pagination.totalRecords - 1
          )
        };

        setSubmissionsState({
          ...currentState,
          data: {
            submissions: updatedSubmissions,
            pagination: updatedPagination
          }
        });

        // Also update infinite scroll data if in infinite mode
        if (infiniteScroll) {
          setInfiniteData((prev) =>
            prev.filter(
              (submission) => submission.submission_id !== submissionId
            )
          );
        }
      }
    },
    [submissionsState, setSubmissionsState, infiniteScroll]
  );

  const updateFilter = useCallback(
    (filterName: PostFilters, newValue: string) => {
      setFiltersState((prevState) => {
        const newFilters = prevState.filters.map((filter) => {
          if (filter.name === filterName) {
            return { ...filter, value: newValue };
          }
          return filter;
        });

        // If filter doesn't exist, add it
        const filterExists = prevState.filters.some(f => f.name === filterName);
        if (!filterExists) {
          newFilters.push({ name: filterName, value: newValue });
        }

        return {
          ...prevState,
          filters: newFilters
        };
      });
    },
    [setFiltersState]
  );

  return {
    // State - return correct data based on mode
    submissions: infiniteScroll
      ? infiniteData
      : submissionsState.data?.submissions || [],
    pagination: submissionsState.data?.pagination || defaultPagination,
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

    // Optimistic updates
    optimisticUpdateSubmission,
    optimisticRemoveSubmission,

    // Computed values
    totalFilters: filtersState.filters.length,
    currentPage: filtersState.page,
    pageSize: filtersState.pageSize,

    // New updateFilter function
    updateFilter
  };
}
