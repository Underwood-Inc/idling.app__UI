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
        return;
      }

      // Cancel any pending request
      if (abortController.current) {
        abortController.current.abort();
      }

      // Create new abort controller for this request
      abortController.current = new AbortController();
      lastFetchParams.current = fetchKey;

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
          return;
        }

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

    // Handle comma-separated values for tags filter (should be single filter with comma-separated values)
    if (tagsParam) {
      const cleanTags = tagsParam
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (cleanTags.length > 0) {
        urlFilters.push({
          name: 'tags' as PostFilters,
          value: cleanTags.join(',')
        });

        // Auto-add tagLogic filter if multiple tags but no explicit tagLogic in URL
        if (cleanTags.length > 1 && !tagLogicParam) {
          urlFilters.push({
            name: 'tagLogic' as PostFilters,
            value: 'OR' // Default to OR logic
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
      if (page === filtersState.page) {
        return;
      }

      setFiltersState((prev) => ({ ...prev, page }));
    },
    [filtersState.page, setFiltersState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      if (pageSize === filtersState.pageSize) {
        return;
      }

      setFiltersState((prev) => ({ ...prev, pageSize, page: 1 }));
    },
    [filtersState.pageSize, setFiltersState]
  );

  const addFilter = useCallback(
    (filter: Filter<PostFilters>) => {
      setFiltersState((prev) => {
        // Check if this exact filter already exists to prevent duplicates
        const isDuplicate = prev.filters.some(
          (f) => f.name === filter.name && f.value === filter.value
        );

        if (isDuplicate) {
          return prev;
        }

        // Add new filter (allow multiple filters with same name but different values)
        const newFilters = [...prev.filters, filter];

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
      setFiltersState((prev) => {
        const newFilters = filterValue
          ? prev.filters.filter(
              (f) => !(f.name === filterName && f.value === filterValue)
            )
          : prev.filters.filter((f) => f.name !== filterName);

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
      setFiltersState((prev) => {
        const tagsFilter = prev.filters.find((f) => f.name === 'tags');
        if (!tagsFilter) {
          return prev;
        }

        // Parse current tags and remove the specific tag
        const currentTags = tagsFilter.value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        const newTags = currentTags.filter((tag) => tag !== tagToRemove);

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
