import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getSubmissionsWithReplies } from '../../app/components/submissions-list/actions';
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
  providerAccountId?: string;
  includeThreadReplies?: boolean;
}

// Use SubmissionWithReplies to support thread structure
interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
}

export function useSubmissionsManager({
  contextId,
  onlyMine = false,
  initialFilters = [],
  providerAccountId: initialProviderAccountId,
  includeThreadReplies = false
}: UseSubmissionsManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use shared Jotai atoms instead of local state
  const [submissionsState, setSubmissionsState] = useAtom(
    getSubmissionsStateAtom(contextId)
  );
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

  // Monitor global shouldUpdate atom for refresh triggers
  const [shouldUpdate, setShouldUpdate] = useAtom(shouldUpdateAtom);

  // Refs to prevent infinite loops and optimize requests
  const isInitializing = useRef(true);
  const lastUrlParams = useRef<string>('');
  const fetchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastFetchParams = useRef<string>('');
  const abortController = useRef<AbortController>();
  const lastSyncedFilters = useRef<string>('');

  // Memoized provider account ID
  const providerAccountId = useMemo(
    () => initialProviderAccountId || session?.user?.providerAccountId || '',
    [initialProviderAccountId, session?.user?.providerAccountId]
  );

  // Ensure atoms are properly initialized
  useEffect(() => {
    if (!filtersState.initialized) {
      // eslint-disable-next-line no-console
      console.log(
        '🚀 [MANAGER] Initializing filters state for context:',
        contextId
      );
      setFiltersState((prev) => ({
        ...prev,
        onlyMine,
        providerAccountId,
        initialized: true
      }));
    }
  }, [
    contextId,
    onlyMine,
    providerAccountId,
    filtersState.initialized,
    setFiltersState
  ]);

  // Create a stable fetch key for deduplication
  const createFetchKey = useCallback(
    (
      currentFilters: Filter<PostFilters>[],
      currentPage: number,
      currentPageSize: number
    ) => {
      return JSON.stringify({
        filters: currentFilters,
        page: currentPage,
        pageSize: currentPageSize,
        onlyMine,
        providerAccountId,
        includeThreadReplies
      });
    },
    [onlyMine, providerAccountId, includeThreadReplies]
  );

  // URL synchronization effect - only when filters change
  useEffect(() => {
    if (isInitializing.current || !filtersState.initialized) return;

    const currentFiltersKey = JSON.stringify({
      filters: filtersState.filters,
      page: filtersState.page,
      pageSize: filtersState.pageSize
    });

    // Skip if filters haven't changed
    if (lastSyncedFilters.current === currentFiltersKey) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('🔗 [MANAGER] Syncing URL with state:', {
      filters: filtersState.filters,
      page: filtersState.page,
      pageSize: filtersState.pageSize
    });

    const params = new URLSearchParams();

    // Add filters to URL - combine multiple values for same filter type
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
        params.set(name, values.join(','));
      } else if (name === 'tagLogic' && filterGroups.tags) {
        params.set('tagLogic', values[0]);
      } else if (name === 'authorLogic' && filterGroups.author) {
        params.set('authorLogic', values[0]);
      } else if (name === 'mentionsLogic' && filterGroups.mentions) {
        params.set('mentionsLogic', values[0]);
      } else if (name === 'globalLogic') {
        params.set('globalLogic', values[0]);
      }
    });

    // Add pagination
    if (filtersState.page > 1) {
      params.set('page', filtersState.page.toString());
    }
    if (filtersState.pageSize !== 10) {
      params.set('pageSize', filtersState.pageSize.toString());
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

    // Only update URL if it's different
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (newUrl !== currentUrl) {
      router.push(newUrl, { scroll: false });
      lastSyncedFilters.current = currentFiltersKey;
    }
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized,
    pathname,
    router,
    searchParams
  ]);

  // Optimized fetch function with deduplication
  const fetchSubmissions = useCallback(
    async (
      currentFilters: Filter<PostFilters>[],
      currentPage: number,
      currentPageSize: number
    ) => {
      const fetchKey = createFetchKey(
        currentFilters,
        currentPage,
        currentPageSize
      );

      // Skip if this is the same request we just made
      if (lastFetchParams.current === fetchKey) {
        // eslint-disable-next-line no-console
        console.log('🔄 [MANAGER] Skipping duplicate request');
        return;
      }

      // Cancel any pending request
      if (abortController.current) {
        abortController.current.abort();
      }

      // Create new abort controller for this request
      abortController.current = new AbortController();
      lastFetchParams.current = fetchKey;

      // eslint-disable-next-line no-console
      console.log('🔄 [MANAGER] fetchSubmissions called with:', {
        currentFilters,
        currentPage,
        currentPageSize,
        onlyMine
      });

      setSubmissionsState((prev) => ({
        ...prev,
        loading: true,
        error: undefined
      }));

      try {
        // Always use getSubmissionsWithReplies to ensure proper thread structure
        // Thread replies will never appear as standalone items in the main list
        const result = await getSubmissionsWithReplies({
          onlyMine,
          providerAccountId,
          filters: currentFilters,
          page: currentPage,
          pageSize: currentPageSize,
          includeThreadReplies
        });

        // Check if request was aborted
        if (abortController.current?.signal.aborted) {
          // eslint-disable-next-line no-console
          console.log('🔄 [MANAGER] Request was aborted');
          return;
        }

        // eslint-disable-next-line no-console
        console.log('🔄 [MANAGER] API response received:', {
          hasError: !!result.error,
          error: result.error,
          dataCount: result.data?.data?.length || 0,
          totalRecords: result.data?.pagination?.totalRecords || 0,
          currentPage: result.data?.pagination?.currentPage || 0
        });

        if (result.error) {
          setSubmissionsState({
            loading: false,
            error: result.error,
            data: undefined
          });
        } else if (result.data) {
          setSubmissionsState({
            loading: false,
            error: undefined,
            data: {
              submissions: result.data.data,
              pagination: result.data.pagination
            }
          });
          // eslint-disable-next-line no-console
          console.log('🔄 [MANAGER] State updated successfully');
        }
      } catch (err) {
        // Don't show error if request was aborted
        if (abortController.current?.signal.aborted) {
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch submissions';
        console.error('🔄 [MANAGER] Fetch error:', err);
        setSubmissionsState({
          loading: false,
          error: errorMessage,
          data: undefined
        });
      }
    },
    [
      onlyMine,
      providerAccountId,
      createFetchKey,
      setSubmissionsState,
      includeThreadReplies
    ]
  );

  // Initialize from URL parameters and handle URL changes
  useEffect(() => {
    const currentUrlParams = searchParams.toString();

    // Skip if this is the same URL we just set
    if (lastUrlParams.current === currentUrlParams && !isInitializing.current) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('🚀 [MANAGER] Processing URL change:', {
      searchParams: currentUrlParams,
      contextId,
      onlyMine,
      isInitializing: isInitializing.current
    });

    const pageParam = searchParams.get('page');
    const tagsParam = searchParams.get('tags');
    const authorParam = searchParams.get('author');
    const mentionsParam = searchParams.get('mentions');
    const tagLogicParam = searchParams.get('tagLogic');
    const authorLogicParam = searchParams.get('authorLogic');
    const mentionsLogicParam = searchParams.get('mentionsLogic');
    const globalLogicParam = searchParams.get('globalLogic');
    const pageSizeParam = searchParams.get('pageSize');

    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const pageSize = pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 10;

    // Build filters array including all logic parameters
    const urlFilters: Filter<PostFilters>[] = [];

    // Handle comma-separated values for filters that can have multiple instances
    if (tagsParam) {
      tagsParam.split(',').forEach((value) => {
        if (value.trim()) {
          urlFilters.push({ name: 'tags' as PostFilters, value: value.trim() });
        }
      });
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
    if (tagLogicParam && (tagLogicParam === 'OR' || tagLogicParam === 'AND')) {
      urlFilters.push({
        name: 'tagLogic' as PostFilters,
        value: tagLogicParam
      });
    }
    if (
      authorLogicParam &&
      (authorLogicParam === 'OR' || authorLogicParam === 'AND')
    ) {
      urlFilters.push({
        name: 'authorLogic' as PostFilters,
        value: authorLogicParam
      });
    }
    if (
      mentionsLogicParam &&
      (mentionsLogicParam === 'OR' || mentionsLogicParam === 'AND')
    ) {
      urlFilters.push({
        name: 'mentionsLogic' as PostFilters,
        value: mentionsLogicParam
      });
    }
    if (
      globalLogicParam &&
      (globalLogicParam === 'OR' || globalLogicParam === 'AND')
    ) {
      urlFilters.push({
        name: 'globalLogic' as PostFilters,
        value: globalLogicParam
      });
    }

    // eslint-disable-next-line no-console
    console.log('🚀 [MANAGER] Updating state from URL:', {
      page,
      pageSize,
      urlFilters,
      providerAccountId: providerAccountId
        ? `${providerAccountId.substring(0, 8)}...`
        : 'null'
    });

    // Update shared atom state
    setFiltersState({
      onlyMine,
      providerAccountId,
      filters: urlFilters,
      page,
      pageSize,
      initialized: true
    });

    lastUrlParams.current = currentUrlParams;

    if (isInitializing.current) {
      isInitializing.current = false;
    }
  }, [
    searchParams.toString(),
    contextId,
    onlyMine,
    providerAccountId,
    setFiltersState
  ]);

  // Single debounced fetch effect that triggers on any relevant state change
  useEffect(() => {
    if (isInitializing.current || !filtersState.initialized) return;

    // eslint-disable-next-line no-console
    console.log('⏱️ [MANAGER] Setting up debounced fetch:', {
      filtersCount: filtersState.filters.length,
      page: filtersState.page,
      pageSize: filtersState.pageSize
    });

    // Clear previous timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    // Debounce the fetch request
    fetchTimeout.current = setTimeout(() => {
      fetchSubmissions(
        filtersState.filters as Filter<PostFilters>[],
        filtersState.page,
        filtersState.pageSize
      );
    }, 300);

    return () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized,
    fetchSubmissions
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Monitor shouldUpdate atom for refresh triggers
  useEffect(() => {
    if (shouldUpdate && !isInitializing.current && filtersState.initialized) {
      // eslint-disable-next-line no-console
      console.log('🔄 [MANAGER] shouldUpdate triggered, refreshing...');

      // Reset the shouldUpdate flag
      setShouldUpdate(false);

      // Force a refresh by triggering fetchSubmissions
      fetchSubmissions(
        filtersState.filters as Filter<PostFilters>[],
        filtersState.page,
        filtersState.pageSize
      );
    }
  }, [
    shouldUpdate,
    setShouldUpdate,
    fetchSubmissions,
    filtersState.filters,
    filtersState.page,
    filtersState.pageSize,
    filtersState.initialized
  ]);

  // Action methods that update shared atoms
  const setPage = useCallback(
    (page: number) => {
      // eslint-disable-next-line no-console
      console.log('📄 [MANAGER] setPage called:', {
        page,
        currentPage: filtersState.page
      });

      if (page === filtersState.page) {
        // eslint-disable-next-line no-console
        console.log('📄 [MANAGER] Page unchanged, skipping');
        return;
      }

      setFiltersState((prev) => ({ ...prev, page }));
    },
    [filtersState.page, setFiltersState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      // eslint-disable-next-line no-console
      console.log('📏 [MANAGER] setPageSize called:', {
        pageSize,
        currentPageSize: filtersState.pageSize
      });

      if (pageSize === filtersState.pageSize) {
        // eslint-disable-next-line no-console
        console.log('📏 [MANAGER] Page size unchanged, skipping');
        return;
      }

      setFiltersState((prev) => ({ ...prev, pageSize, page: 1 }));
    },
    [filtersState.pageSize, setFiltersState]
  );

  const addFilter = useCallback(
    (filter: Filter<PostFilters>) => {
      console.log('🏷️ [MANAGER] addFilter called:', filter);

      setFiltersState((prev) => {
        console.log('🏷️ [MANAGER] Current filters before add:', prev.filters);

        // Check if this exact filter already exists to prevent duplicates
        const isDuplicate = prev.filters.some(
          (f) => f.name === filter.name && f.value === filter.value
        );

        if (isDuplicate) {
          console.log('🏷️ [MANAGER] Filter already exists, skipping:', filter);
          return prev;
        }

        // Add new filter (allow multiple filters with same name but different values)
        const newFilters = [...prev.filters, filter];
        console.log('🏷️ [MANAGER] Filters after add:', newFilters);

        return {
          ...prev,
          filters: newFilters,
          page: 1
        };
      });
    },
    [setFiltersState]
  );

  const removeFilter = useCallback(
    (filterName: PostFilters, filterValue?: string) => {
      console.log('🗑️ [MANAGER] removeFilter called:', {
        filterName,
        filterValue
      });

      setFiltersState((prev) => {
        console.log(
          '🗑️ [MANAGER] Current filters before removal:',
          prev.filters
        );

        const newFilters = filterValue
          ? prev.filters.filter(
              (f) => !(f.name === filterName && f.value === filterValue)
            )
          : prev.filters.filter((f) => f.name !== filterName);

        console.log('🗑️ [MANAGER] Filters after removal:', newFilters);

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
      console.log('🏷️ [MANAGER] removeTag called:', tagToRemove);

      setFiltersState((prev) => {
        const tagsFilter = prev.filters.find((f) => f.name === 'tags');
        if (!tagsFilter) {
          // eslint-disable-next-line no-console
          console.log('🏷️ [MANAGER] No tags filter found');
          return prev;
        }

        // Parse current tags and remove the specific tag
        const currentTags = tagsFilter.value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        const newTags = currentTags.filter((tag) => tag !== tagToRemove);

        // eslint-disable-next-line no-console
        console.log('🏷️ [MANAGER] Tags before removal:', currentTags);
        console.log('🏷️ [MANAGER] Tags after removal:', newTags);

        let newFilters = [...prev.filters];

        if (newTags.length === 0) {
          // Remove both tags and tagLogic filters when no tags left
          newFilters = newFilters.filter(
            (f) => f.name !== 'tags' && f.name !== 'tagLogic'
          );
        } else {
          // Update tags filter with remaining tags
          const tagsIndex = newFilters.findIndex((f) => f.name === 'tags');
          if (tagsIndex >= 0) {
            newFilters[tagsIndex] = { name: 'tags', value: newTags.join(',') };
          }

          // Remove tagLogic if only one tag remains
          if (newTags.length === 1) {
            newFilters = newFilters.filter((f) => f.name !== 'tagLogic');
          }
        }

        return {
          ...prev,
          filters: newFilters,
          page: 1 // Reset to first page when removing tags
        };
      });
    },
    [setFiltersState]
  );

  const clearFilters = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🧹 [MANAGER] clearFilters called');

    setFiltersState((prev) => ({
      ...prev,
      filters: [],
      page: 1
    }));
  }, [setFiltersState]);

  // Display filters (exclude tagLogic from UI display)
  const displayFilters = useMemo(() => {
    return filtersState.filters.filter((f) => f.name !== 'tagLogic');
  }, [filtersState.filters]);

  // Extract data from atoms
  const submissions = submissionsState.data?.submissions || [];
  const pagination: PaginationInfo = submissionsState.data?.pagination || {
    currentPage: filtersState.page,
    pageSize: filtersState.pageSize,
    totalRecords: 0
  };

  return {
    // State
    submissions,
    pagination,
    filters: displayFilters, // Only return display filters
    isLoading: submissionsState.loading,
    error: submissionsState.error,

    // Actions
    setPage,
    setPageSize,
    addFilter,
    removeFilter,
    removeTag,
    clearFilters,

    // Computed
    totalPages: Math.ceil(pagination.totalRecords / pagination.pageSize)
  };
}
