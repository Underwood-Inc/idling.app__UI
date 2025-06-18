import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSubmissionsWithReplies } from '../../app/components/submissions-list/actions';
import { PostFilters } from '../types/filters';
import {
  Filter,
  getSubmissionsFiltersAtom,
  getSubmissionsStateAtom,
  shouldUpdateAtom,
  SubmissionsFilters
} from './atoms';

interface UseSubmissionsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  initialFilters?: Filter<PostFilters>[];
  providerAccountId?: string;
  includeThreadReplies?: boolean;
  infiniteScroll?: boolean;
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
  includeThreadReplies = false,
  infiniteScroll = false
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

  // Use filtersState directly for immediate, atomic updates
  const effectiveFiltersState = filtersState;

  // Refs to prevent infinite loops and optimize requests
  const isInitializing = useRef(true);
  const lastUrlParams = useRef<string>('');
  const fetchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastFetchParams = useRef<string>('');
  const abortController = useRef<AbortController>();
  const lastSyncedFilters = useRef<string>('');

  // Infinite scroll state
  const [infiniteData, setInfiniteData] = useState<any[]>([]);
  const [infinitePage, setInfinitePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  // URL synchronization effect - only when filters change and not in infinite mode
  useEffect(() => {
    if (isInitializing.current || !filtersState.initialized || infiniteScroll)
      return;

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
        // Strip # prefix from tags for cleaner URLs
        if (name === 'tags') {
          const cleanValues = values.map((value) =>
            value
              .split(',')
              .map((tag) =>
                tag.trim().startsWith('#') ? tag.substring(1) : tag
              )
              .join(',')
          );
          params.set(name, cleanValues.join(','));
        } else {
          params.set(name, values.join(','));
        }
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

    // Add pagination only if not in infinite scroll mode
    if (!infiniteScroll) {
      if (filtersState.page > 1) {
        params.set('page', filtersState.page.toString());
      }
      if (filtersState.pageSize !== 10) {
        params.set('pageSize', filtersState.pageSize.toString());
      }
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
    searchParams,
    infiniteScroll
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
        const result = await getSubmissionsWithReplies({
          filters: currentFilters,
          page: currentPage,
          pageSize: currentPageSize,
          onlyMine,
          providerAccountId,
          includeThreadReplies
        });

        if (result.data) {
          if (infiniteScroll && currentPage === 1) {
            // For infinite scroll, initialize the infinite data
            setInfiniteData(result.data.data || []);
            setInfinitePage(1);
            setHasMore(
              (result.data.data?.length || 0) <
                (result.data.pagination?.totalRecords || 0)
            );
          }

          setSubmissionsState((prev) => ({
            ...prev,
            loading: false,
            data: {
              submissions: result.data?.data || [],
              pagination: result.data?.pagination || {
                currentPage: currentPage,
                pageSize: currentPageSize,
                totalRecords: 0
              }
            },
            error: undefined
          }));
        } else {
          setSubmissionsState((prev) => ({
            ...prev,
            loading: false,
            error: result.error || 'Failed to fetch submissions'
          }));
        }
      } catch (error: any) {
        console.error('Error fetching submissions:', error);
        setSubmissionsState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch submissions'
        }));
      }
    },
    [
      onlyMine,
      providerAccountId,
      includeThreadReplies,
      createFetchKey,
      infiniteScroll
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
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)) // Add # prefix when reading from URL
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

  // Single fetch effect that triggers on any relevant state change
  useEffect(() => {
    if (isInitializing.current || !effectiveFiltersState.initialized) return;

    // Only fetch if we're not already loading and this is a different request
    const fetchKey = createFetchKey(
      effectiveFiltersState.filters as Filter<PostFilters>[],
      effectiveFiltersState.page,
      effectiveFiltersState.pageSize
    );

    if (lastFetchParams.current === fetchKey && !submissionsState.error) {
      // Same request and no error - skip
      return;
    }

    // Clear previous timeout to prevent duplicate requests
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    // Add debouncing to prevent rapid successive requests
    fetchTimeout.current = setTimeout(() => {
      // Double-check that this is still a different request
      const currentFetchKey = createFetchKey(
        effectiveFiltersState.filters as Filter<PostFilters>[],
        effectiveFiltersState.page,
        effectiveFiltersState.pageSize
      );

      if (
        lastFetchParams.current === currentFetchKey ||
        submissionsState.loading
      ) {
        return; // Skip if same request or already loading
      }

      fetchSubmissions(
        effectiveFiltersState.filters as Filter<PostFilters>[],
        effectiveFiltersState.page,
        effectiveFiltersState.pageSize
      );
    }, 50); // Reduced debounce to align with batching timeout
  }, [
    // Track filter changes directly for immediate response
    JSON.stringify(effectiveFiltersState.filters),
    effectiveFiltersState.page,
    effectiveFiltersState.pageSize,
    effectiveFiltersState.initialized,
    fetchSubmissions,
    createFetchKey,
    submissionsState.loading,
    submissionsState.error
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
    if (
      shouldUpdate &&
      !isInitializing.current &&
      effectiveFiltersState.initialized
    ) {
      // Reset the shouldUpdate flag
      setShouldUpdate(false);

      // Force a refresh by triggering fetchSubmissions
      fetchSubmissions(
        effectiveFiltersState.filters as Filter<PostFilters>[],
        effectiveFiltersState.page,
        effectiveFiltersState.pageSize
      );
    }
  }, [
    shouldUpdate,
    setShouldUpdate,
    fetchSubmissions,
    effectiveFiltersState.filters,
    effectiveFiltersState.page,
    effectiveFiltersState.pageSize,
    effectiveFiltersState.initialized
  ]);

  // Batched filter updates to prevent multiple network requests
  const batchedFilterUpdates = useRef<{
    pending: Array<(prev: SubmissionsFilters) => SubmissionsFilters>;
    timeout?: ReturnType<typeof setTimeout>;
  }>({ pending: [] });

  // Batched filter update function
  const updateFiltersBatched = useCallback(
    (updater: (prev: SubmissionsFilters) => SubmissionsFilters) => {
      // Add to pending updates
      batchedFilterUpdates.current.pending.push(updater);

      // Clear existing timeout
      if (batchedFilterUpdates.current.timeout) {
        clearTimeout(batchedFilterUpdates.current.timeout);
      }

      // Process batch with minimal delay for atomic updates
      batchedFilterUpdates.current.timeout = setTimeout(() => {
        const updates = batchedFilterUpdates.current.pending;
        batchedFilterUpdates.current.pending = [];

        if (updates.length > 0) {
          // Apply all updates atomically
          setFiltersState((prev) => {
            return updates.reduce((state, update) => update(state), prev);
          });
        }
      }, 50); // Align with fetch debounce timing
    },
    [setFiltersState]
  );

  // Enhanced addFilters function using batched updates
  const addFilters = useCallback(
    (filters: Filter<PostFilters>[]) => {
      updateFiltersBatched((prev) => {
        let newFilters = [...prev.filters];

        // Process each filter
        for (const filter of filters) {
          // Check for duplicates
          const isDuplicate = newFilters.some(
            (f) => f.name === filter.name && f.value === filter.value
          );

          if (isDuplicate) {
            continue;
          }

          // Handle logic filters
          if (filter.name.endsWith('Logic')) {
            const existingIndex = newFilters.findIndex(
              (f) => f.name === filter.name
            );

            if (existingIndex >= 0) {
              newFilters[existingIndex] = filter;
            } else {
              newFilters.push(filter);
            }
            continue;
          }

          // Handle tags consolidation
          if (filter.name === 'tags') {
            const existingTagsIndex = newFilters.findIndex(
              (f) => f.name === 'tags'
            );

            if (existingTagsIndex >= 0) {
              // Consolidate with existing tags
              const existingTags = newFilters[existingTagsIndex].value
                .split(',')
                .map((tag: string) => tag.trim())
                .filter(Boolean);

              const newTags = filter.value
                .split(',')
                .map((tag: string) => tag.trim())
                .filter(Boolean);

              // Combine and deduplicate tags
              const allTags = [...existingTags, ...newTags];
              const uniqueTags = [...new Set(allTags)];

              // Update the existing tags filter
              newFilters[existingTagsIndex] = {
                name: 'tags',
                value: uniqueTags.join(',')
              };
            } else {
              // No existing tags filter, add the new one
              newFilters.push(filter);
            }
          } else {
            // For other filters, just add normally
            newFilters.push(filter);
          }
        }

        // Auto-add tagLogic if we have multiple tags and no logic filter exists
        const tagsFilter = newFilters.find((f) => f.name === 'tags');
        if (tagsFilter) {
          const tags = tagsFilter.value
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean);

          if (tags.length > 1) {
            const hasTagLogic = newFilters.some((f) => f.name === 'tagLogic');
            if (!hasTagLogic) {
              newFilters.push({
                name: 'tagLogic',
                value: 'OR' // Default to OR logic
              });
            }
          }
        }

        return {
          ...prev,
          filters: newFilters,
          page: 1
        };
      });
    },
    [updateFiltersBatched]
  );

  // Enhanced addFilter function using batched updates
  const addFilter = useCallback(
    (filter: Filter<PostFilters>) => {
      updateFiltersBatched((prev) => {
        // Check if this exact filter already exists to prevent duplicates
        const isDuplicate = prev.filters.some(
          (f) => f.name === filter.name && f.value === filter.value
        );

        if (isDuplicate) {
          return prev;
        }

        // For logic filters, update existing rather than add duplicate
        if (filter.name.endsWith('Logic')) {
          const newFilters = [...prev.filters];
          const existingIndex = newFilters.findIndex(
            (f) => f.name === filter.name
          );

          if (existingIndex >= 0) {
            newFilters[existingIndex] = filter;
          } else {
            newFilters.push(filter);
          }

          return {
            ...prev,
            filters: newFilters,
            page: 1
          };
        }

        // Start with current filters
        let newFilters = [...prev.filters];

        // Special handling for tags to consolidate them immediately
        if (filter.name === 'tags') {
          // Find existing tags filter
          const existingTagsIndex = newFilters.findIndex(
            (f) => f.name === 'tags'
          );

          if (existingTagsIndex >= 0) {
            // Consolidate with existing tags
            const existingTags = newFilters[existingTagsIndex].value
              .split(',')
              .map((tag: string) => tag.trim())
              .filter(Boolean);

            const newTags = filter.value
              .split(',')
              .map((tag: string) => tag.trim())
              .filter(Boolean);

            // Combine and deduplicate tags
            const allTags = [...existingTags, ...newTags];
            const uniqueTags = [...new Set(allTags)];

            // Update the existing tags filter
            newFilters[existingTagsIndex] = {
              name: 'tags',
              value: uniqueTags.join(',')
            };

            // Auto-add tagLogic if we have multiple tags and no logic filter exists
            if (uniqueTags.length > 1) {
              const hasTagLogic = newFilters.some((f) => f.name === 'tagLogic');
              if (!hasTagLogic) {
                newFilters.push({
                  name: 'tagLogic',
                  value: 'OR' // Default to OR logic
                });
              }
            }
          } else {
            // No existing tags filter, add the new one
            newFilters.push(filter);

            // Auto-add tagLogic if we have multiple tags in the new filter
            const newTags = filter.value
              .split(',')
              .map((tag: string) => tag.trim())
              .filter(Boolean);
            if (newTags.length > 1) {
              newFilters.push({
                name: 'tagLogic',
                value: 'OR' // Default to OR logic
              });
            }
          }
        } else {
          // For non-tags filters, just add normally (allow multiple filters with same name but different values)
          newFilters.push(filter);
        }

        return {
          ...prev,
          filters: newFilters,
          page: 1
        };
      });
    },
    [updateFiltersBatched]
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

    if (infiniteScroll) {
      // Reset infinite scroll state when filters change
      setInfiniteData([]);
      setInfinitePage(1);
      setHasMore(true);
    }
  }, [setFiltersState, infiniteScroll]);

  // Load more function for infinite scroll with performance optimizations
  const loadMore = useCallback(async () => {
    // Multiple guards to prevent unnecessary requests
    if (!infiniteScroll || isLoadingMore || !hasMore) return;

    // Prevent rapid consecutive calls
    const now = Date.now();
    const lastCallKey = `${contextId}-last-load-more-call`;
    const lastCall = parseInt(sessionStorage.getItem(lastCallKey) || '0');
    const minInterval = 500; // Minimum 500ms between calls

    if (now - lastCall < minInterval) {
      return;
    }

    sessionStorage.setItem(lastCallKey, now.toString());
    setIsLoadingMore(true);

    try {
      const nextPage = infinitePage + 1;

      const result = await getSubmissionsWithReplies({
        filters: effectiveFiltersState.filters as Filter<PostFilters>[],
        page: nextPage,
        pageSize: effectiveFiltersState.pageSize,
        onlyMine,
        providerAccountId,
        includeThreadReplies
      });

      if (result.data) {
        const newSubmissions = result.data.data || [];

        // Only update state if we actually got new data
        if (newSubmissions.length > 0) {
          setInfiniteData((prev) => [...prev, ...newSubmissions]);
          setInfinitePage(nextPage);

          // Check if we have more data
          const totalLoaded = infiniteData.length + newSubmissions.length;
          const totalAvailable = result.data.pagination?.totalRecords || 0;
          setHasMore(totalLoaded < totalAvailable);
        } else {
          // No more data available
          setHasMore(false);
        }
      } else {
        // Handle error case
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error loading more submissions:', error);
      // Don't disable hasMore on error - allow retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    infiniteScroll,
    isLoadingMore,
    hasMore,
    infinitePage,
    infiniteData.length,
    effectiveFiltersState.filters,
    effectiveFiltersState.pageSize,
    onlyMine,
    providerAccountId,
    includeThreadReplies,
    contextId
  ]);

  // Display filters (include all filters for proper FilterBar functionality)
  const displayFilters = useMemo(() => {
    return effectiveFiltersState.filters; // Include all filters including logic filters
  }, [effectiveFiltersState.filters]);

  // Extract data from atoms
  const submissions = infiniteScroll
    ? infiniteData
    : submissionsState.data?.submissions || [];
  const pagination: PaginationInfo = submissionsState.data?.pagination || {
    currentPage: effectiveFiltersState.page,
    pageSize: effectiveFiltersState.pageSize,
    totalRecords: 0
  };

  // Action methods that update shared atoms using batched updates
  const setPage = useCallback(
    (page: number) => {
      if (page === effectiveFiltersState.page) {
        return;
      }

      updateFiltersBatched((prev) => ({ ...prev, page }));
    },
    [effectiveFiltersState.page, updateFiltersBatched]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      if (pageSize === effectiveFiltersState.pageSize) {
        return;
      }

      updateFiltersBatched((prev) => ({ ...prev, pageSize, page: 1 }));
    },
    [effectiveFiltersState.pageSize, updateFiltersBatched]
  );

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
    addFilters,
    removeFilter,
    removeTag,
    clearFilters,
    loadMore,

    // Computed
    totalPages: Math.ceil(pagination.totalRecords / pagination.pageSize),

    // Infinite scroll state
    isLoadingMore,
    hasMore
  };
}
