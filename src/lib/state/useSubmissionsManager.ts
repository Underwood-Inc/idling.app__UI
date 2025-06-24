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
  }
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

  // User ID with session fallback (internal database ID)
  const userId = useMemo(() => {
    return initialUserId || session?.user?.id || '';
  }, [initialUserId, session?.user?.id]);

  // Simple fetch function
  const fetchSubmissions = useCallback(async () => {
    if (!filtersState.initialized) {
      return;
    }

    const fetchKey = JSON.stringify({
      filters: filtersState.filters,
      page: filtersState.page,
      pageSize: filtersState.pageSize,
      onlyMine,
      userId,
      includeThreadReplies
    });

    logger.group('fetchSubmissions');
    logger.debug('fetchSubmissions called', {
      fetchKey: fetchKey.substring(0, 100) + '...',
      lastFetchKey: lastFetchKey.current.substring(0, 100) + '...',
      isSameFetch: lastFetchKey.current === fetchKey,
      filtersCount: filtersState.filters.length,
      page: filtersState.page
    });

    // Skip if this exact same fetch was already done
    if (lastFetchKey.current === fetchKey) {
      logger.debug('Skipping duplicate fetch');
      logger.groupEnd();
      return;
    }

    lastFetchKey.current = fetchKey;
    isFetching.current = true;

    logger.debug('Starting fetch with filters', {
      filters: filtersState.filters,
      page: filtersState.page,
      pageSize: filtersState.pageSize
    });

    setSubmissionsState((prev) => ({
      ...prev,
      loading: true,
      error: undefined
    }));

    try {
      const result = await getSubmissionsWithReplies({
        filters: filtersState.filters as Filter<PostFilters>[],
        page: filtersState.page,
        pageSize: filtersState.pageSize,
        onlyMine,
        userId,
        includeThreadReplies
      });

      if (result.data) {
        setSubmissionsState({
          loading: false,
          data: {
            submissions: result.data.data || [],
            pagination: result.data.pagination || {
              currentPage: filtersState.page,
              pageSize: filtersState.pageSize,
              totalRecords: 0
            }
          },
          error: undefined
        });

        // Initialize infinite scroll data on first load
        if (infiniteScroll && filtersState.page === 1) {
          setInfiniteData(result.data.data || []);
          setInfinitePage(1);
          setHasMore((result.data.data?.length || 0) === filtersState.pageSize);
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
        filters: filtersState.filters,
        page: filtersState.page,
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
      isFetching.current = false;
    }
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized,
    onlyMine,
    userId,
    includeThreadReplies,
    infiniteScroll,
    setSubmissionsState
  ]);

  // Initialize from URL once
  useEffect(() => {
    const currentUrlParams = searchParams.toString();

    if (lastUrlParams.current === currentUrlParams && isInitialized.current) {
      return;
    }

    lastUrlParams.current = currentUrlParams;

    // Check if filters are already initialized from localStorage
    // If they are, don't override them with URL params unless URL has actual filter params
    const hasUrlFilters =
      searchParams.has('tags') ||
      searchParams.has('author') ||
      searchParams.has('mentions');

    // If filters are already initialized and URL doesn't have filter params, skip URL initialization
    if (filtersState.initialized && !hasUrlFilters) {
      logger.group('initializeFromURL');
      logger.debug('Filters already initialized, skipping URL initialization', {
        hasUrlFilters,
        filtersCount: filtersState.filters.length
      });
      logger.groupEnd();
      return;
    }

    // Parse URL parameters into filters
    const urlFilters: Filter<PostFilters>[] = [];

    // Tags filter
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tags = tagsParam.split(',').filter(Boolean);
      if (tags.length > 0) {
        urlFilters.push({
          name: 'tags',
          value: tags.join(',') // Convert array back to comma-separated string
        });
      }
    }

    // Author filter
    const authorParam = searchParams.get('author');
    if (authorParam) {
      urlFilters.push({
        name: 'author',
        value: authorParam
      });
    }

    // Mentions filter
    const mentionsParam = searchParams.get('mentions');
    if (mentionsParam) {
      urlFilters.push({
        name: 'mentions',
        value: mentionsParam
      });
    }

    // Logic filters
    const tagLogicParam = searchParams.get('tagLogic');
    if (tagLogicParam) {
      urlFilters.push({
        name: 'tagLogic',
        value: tagLogicParam
      });
    }

    const authorLogicParam = searchParams.get('authorLogic');
    if (authorLogicParam) {
      urlFilters.push({
        name: 'authorLogic',
        value: authorLogicParam
      });
    }

    const mentionsLogicParam = searchParams.get('mentionsLogic');
    if (mentionsLogicParam) {
      urlFilters.push({
        name: 'mentionsLogic',
        value: mentionsLogicParam
      });
    }

    const globalLogicParam = searchParams.get('globalLogic');
    if (globalLogicParam) {
      urlFilters.push({
        name: 'globalLogic',
        value: globalLogicParam
      });
    }

    // Page parameter
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // Initialize filters with URL params or initial filters
    const finalFilters = urlFilters.length > 0 ? urlFilters : initialFilters;

    logger.group('initializeFromURL');
    logger.debug('Initializing from URL', {
      urlParams: currentUrlParams,
      urlFilters,
      finalFilters,
      page,
      hasUrlFilters
    });
    logger.groupEnd();

    setFiltersState((prevState) => ({
      ...prevState,
      filters: finalFilters,
      page,
      initialized: true
    }));

    isInitialized.current = true;
  }, [searchParams, initialFilters, filtersState.initialized, setFiltersState]);

  // Fetch when filters change (with debouncing and coordination)
  useEffect(() => {
    if (!filtersState.initialized) return;

    const timeoutId = setTimeout(() => {
      fetchSubmissions();
    }, 150); // Slightly longer delay to coordinate with URL sync

    return () => clearTimeout(timeoutId);
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized,
    fetchSubmissions
  ]);

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

  // Update URL when filters change (debounced and coordinated)
  useEffect(() => {
    if (!filtersState.initialized || infiniteScroll) return;

    const timeoutId = setTimeout(() => {
      const urlParams = new URLSearchParams();

      // Add filters to URL
      const filterGroups = filtersState.filters.reduce(
        (acc, filter) => {
          if (!acc[filter.name]) acc[filter.name] = [];
          acc[filter.name].push(filter.value);
          return acc;
        },
        {} as Record<string, string[]>
      );

      Object.entries(filterGroups).forEach(([name, values]) => {
        if (name === 'tags' || name === 'author' || name === 'mentions') {
          if (name === 'tags') {
            const cleanValues = values.map((value) =>
              value
                .split(',')
                .map((tag) =>
                  tag.trim().startsWith('#') ? tag.substring(1) : tag
                )
                .join(',')
            );
            urlParams.set(name, cleanValues.join(','));
          } else {
            urlParams.set(name, values.join(','));
          }
        } else if (name === 'tagLogic' && filterGroups.tags) {
          urlParams.set('tagLogic', values[0]);
        } else if (name === 'authorLogic' && filterGroups.author) {
          urlParams.set('authorLogic', values[0]);
        } else if (name === 'mentionsLogic' && filterGroups.mentions) {
          urlParams.set('mentionsLogic', values[0]);
        } else if (name === 'globalLogic') {
          urlParams.set('globalLogic', values[0]);
        }
      });

      // Add pagination
      if (filtersState.page > 1) {
        urlParams.set('page', filtersState.page.toString());
      }
      if (filtersState.pageSize !== 10) {
        urlParams.set('pageSize', filtersState.pageSize.toString());
      }

      const newUrl = `${pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

      // Only update if URL actually changed
      if (newUrl !== window.location.pathname + window.location.search) {
        router.push(newUrl, { scroll: false });
      }
    }, 100); // Shorter delay than fetch to ensure URL updates first

    return () => clearTimeout(timeoutId);
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized,
    router,
    pathname,
    infiniteScroll
  ]);

  // Simple action functions
  const addFilter = useCallback(
    (filter: Filter<PostFilters>) => {
      logger.group('addFilter');
      logger.debug('addFilter called', { filter });

      setFiltersState((prevState) => ({
        ...prevState,
        filters: [...prevState.filters, filter],
        page: 1
      }));
      logger.groupEnd();
    },
    [setFiltersState]
  );

  const addFilters = useCallback(
    (filters: Filter<PostFilters>[]) => {
      logger.group('addFilters');
      logger.debug('addFilters called', { filters });

      setFiltersState((prevState) => ({
        ...prevState,
        filters: [...prevState.filters, ...filters],
        page: 1
      }));
      logger.groupEnd();
    },
    [setFiltersState]
  );

  const removeFilter = useCallback(
    (filterName: PostFilters, filterValue?: string) => {
      logger.group('removeFilter');
      logger.debug('removeFilter called', { filterName, filterValue });

      setFiltersState((prevState) => {
        const newFilters = prevState.filters.filter((filter) => {
          if (filterValue) {
            return !(
              filter.name === filterName && filter.value === filterValue
            );
          }
          return filter.name !== filterName;
        });

        logger.debug('removeFilter result', {
          originalCount: prevState.filters.length,
          newCount: newFilters.length,
          removed: prevState.filters.length - newFilters.length
        });

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
      logger.groupEnd();
    },
    [setFiltersState]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      logger.group('removeTag');
      logger.debug('removeTag called', { tagToRemove });

      setFiltersState((prevState) => {
        const newFilters = prevState.filters
          .map((filter) => {
            if (filter.name === 'tags') {
              const currentTags = filter.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

              const cleanTagToRemove = tagToRemove.startsWith('#')
                ? tagToRemove
                : `#${tagToRemove}`;

              const updatedTags = currentTags.filter(
                (tag) => tag !== cleanTagToRemove
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

        logger.debug('removeTag result', {
          originalCount: prevState.filters.length,
          newCount: newFilters.length,
          tagToRemove,
          newFilters
        });

        return {
          ...prevState,
          filters: newFilters,
          page: 1
        };
      });
      logger.groupEnd();
    },
    [setFiltersState]
  );

  const setPage = useCallback(
    (page: number) => {
      setFiltersState((prev) => ({ ...prev, page }));
    },
    [setFiltersState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      setFiltersState((prev) => ({ ...prev, pageSize, page: 1 }));
    },
    [setFiltersState]
  );

  const clearFilters = useCallback(() => {
    setFiltersState((prev) => ({
      ...prev,
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
    pageSize: filtersState.pageSize
  };
}
