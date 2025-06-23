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
    if (isFetching.current || !filtersState.initialized) return;

    // Create a unique key for this fetch request
    const fetchKey = JSON.stringify({
      filters: filtersState.filters,
      page: filtersState.page,
      pageSize: filtersState.pageSize,
      onlyMine,
      userId,
      includeThreadReplies
    });

    // eslint-disable-next-line no-console
    console.log('🚀 [DEBUG] fetchSubmissions called:', {
      fetchKey: fetchKey.substring(0, 100) + '...',
      lastFetchKey: lastFetchKey.current.substring(0, 100) + '...',
      isSameFetch: lastFetchKey.current === fetchKey,
      filtersCount: filtersState.filters.length,
      page: filtersState.page
    });

    // Skip if this exact same fetch was already done
    if (lastFetchKey.current === fetchKey) {
      // eslint-disable-next-line no-console
      console.log('⏭️ [DEBUG] Skipping duplicate fetch');
      return;
    }

    lastFetchKey.current = fetchKey;
    isFetching.current = true;

    // eslint-disable-next-line no-console
    console.log(
      '📡 [DEBUG] Starting fetch with filters:',
      filtersState.filters
    );

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
    } catch (error: unknown) {
      console.error('Error in useSubmissionsManager:', error);
      setSubmissionsState((prevState) => ({
        ...prevState,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch submissions'
      }));
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
      // eslint-disable-next-line no-console
      console.log(
        '🔄 Skipping URL initialization - filters already initialized from storage:',
        {
          filtersCount: filtersState.filters.length,
          hasUrlFilters,
          currentFilters: filtersState.filters
        }
      );
      return;
    }

    const pageParam = searchParams.get('page');
    const tagsParam = searchParams.get('tags');
    const authorParam = searchParams.get('author');
    const mentionsParam = searchParams.get('mentions');
    const tagLogicParam = searchParams.get('tagLogic');
    const globalLogicParam = searchParams.get('globalLogic');
    const pageSizeParam = searchParams.get('pageSize');

    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const pageSize = pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 10;

    // Build filters array from URL
    const urlFilters: Filter<PostFilters>[] = [...initialFilters];

    if (tagsParam) {
      const cleanTags = tagsParam
        .split(',')
        .map((tag) => tag.trim())
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
        .filter(Boolean);
      if (cleanTags.length > 0) {
        urlFilters.push({
          name: 'tags' as PostFilters,
          value: cleanTags.join(',')
        });

        if (cleanTags.length > 1 && !tagLogicParam) {
          urlFilters.push({
            name: 'tagLogic' as PostFilters,
            value: 'OR'
          });
        }
      }
    }

    if (authorParam) {
      authorParam.split(',').forEach((value) => {
        if (value.trim()) {
          urlFilters.push({
            name: 'author' as PostFilters,
            value: value.trim()
          });
        }
      });
    }

    if (mentionsParam) {
      mentionsParam.split(',').forEach((value) => {
        if (value.trim()) {
          urlFilters.push({
            name: 'mentions' as PostFilters,
            value: value.trim()
          });
        }
      });
    }

    if (tagLogicParam) {
      urlFilters.push({
        name: 'tagLogic' as PostFilters,
        value: tagLogicParam
      });
    }

    if (globalLogicParam) {
      urlFilters.push({
        name: 'globalLogic' as PostFilters,
        value: globalLogicParam
      });
    }

    // eslint-disable-next-line no-console
    console.log('🔄 Initializing from URL:', {
      hasUrlFilters,
      urlFilters,
      page,
      pageSize,
      wasAlreadyInitialized: filtersState.initialized
    });

    // Set filters state once
    setFiltersState({
      onlyMine,
      userId,
      filters: urlFilters as Filter[],
      page,
      pageSize,
      initialized: true
    });

    isInitialized.current = true;
  }, [
    searchParams,
    setFiltersState,
    onlyMine,
    userId,
    initialFilters,
    filtersState.initialized,
    filtersState.filters
  ]);

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
      // eslint-disable-next-line no-console
      console.log('🔧 [DEBUG] addFilter called:', filter);
      setFiltersState((prev) => ({
        ...prev,
        filters: [...prev.filters, filter] as Filter[],
        page: 1
      }));
    },
    [setFiltersState]
  );

  const addFilters = useCallback(
    (filters: Filter<PostFilters>[]) => {
      // eslint-disable-next-line no-console
      console.log('🔧 [DEBUG] addFilters called:', filters);
      setFiltersState((prev) => ({
        ...prev,
        filters: [...prev.filters, ...filters] as Filter[],
        page: 1
      }));
    },
    [setFiltersState]
  );

  const removeFilter = useCallback(
    (filterName: PostFilters, filterValue?: string) => {
      // eslint-disable-next-line no-console
      console.log('🔧 [DEBUG] removeFilter called:', filterName, filterValue);
      setFiltersState((prev) => {
        const newFilters = filterValue
          ? prev.filters.filter(
              (f) => !(f.name === filterName && f.value === filterValue)
            )
          : prev.filters.filter((f) => f.name !== filterName);

        // eslint-disable-next-line no-console
        console.log('🔧 [DEBUG] removeFilter result:', {
          oldFilters: prev.filters,
          newFilters,
          filterName,
          filterValue
        });

        return {
          ...prev,
          filters: newFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      // eslint-disable-next-line no-console
      console.log('🔧 [DEBUG] removeTag called:', tagToRemove);
      setFiltersState((prev) => {
        const tagsFilter = prev.filters.find((f) => f.name === 'tags');
        if (!tagsFilter) return prev;

        const currentTags = tagsFilter.value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        const newTags = currentTags.filter((tag) => tag !== tagToRemove);

        let newFilters = [...prev.filters];

        if (newTags.length === 0) {
          newFilters = newFilters.filter(
            (f) => f.name !== 'tags' && f.name !== 'tagLogic'
          );
        } else {
          newFilters = newFilters.map((f) =>
            f.name === 'tags' ? { ...f, value: newTags.join(',') } : f
          );

          if (newTags.length === 1) {
            newFilters = newFilters.filter((f) => f.name !== 'tagLogic');
          }
        }

        // eslint-disable-next-line no-console
        console.log('🔧 [DEBUG] removeTag result:', {
          tagToRemove,
          oldFilters: prev.filters,
          newFilters,
          currentTags,
          newTags
        });

        return {
          ...prev,
          filters: newFilters,
          page: 1
        };
      });
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
      console.error('Error loading more submissions:', error);
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
