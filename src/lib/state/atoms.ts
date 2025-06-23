// Import batched updater from separate file
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { CONTEXT_IDS } from '../context-ids';
import { PostFilters } from '../types/filters';

// ============================================================================
// CORE TYPES - Following existing patterns exactly
// ============================================================================

export enum PageSize {
  TEN = 10,
  TWENTY = 20,
  FIFTY = 50,
  HUNDRED = 100
}

// Exact match to PaginationContext types
type TPaginationContext = PaginationPageActionPayload &
  PaginationTotalPagesActionPayload &
  PaginationPageSizeActionPayload;

type PaginationState = {
  [x: string]: TPaginationContext | undefined;
};

type PaginationPageActionPayload = {
  id: string;
  currentPage?: number;
};

type PaginationTotalPagesActionPayload = {
  id: string;
  totalPages?: number;
};

type PaginationPageSizeActionPayload = {
  id: string;
  pageSize?: PageSize;
};

export type PaginationAction =
  | { type: 'RESET_STATE' }
  | { type: 'SET_CURRENT_PAGE'; payload: PaginationPageActionPayload }
  | { type: 'SET_TOTAL_PAGES'; payload: PaginationTotalPagesActionPayload }
  | { type: 'SET_PAGE_SIZE'; payload: PaginationPageSizeActionPayload };

export interface SubmissionsState {
  loading: boolean;
  data?: {
    submissions: any[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalRecords: number;
    };
  };
  error?: string;
}

export interface Filter<T extends string = string> {
  name: T;
  value: string;
}

export interface SubmissionsFilters {
  onlyMine: boolean;
  userId: string;
  filters: Filter[];
  page: number;
  pageSize: number;
  initialized: boolean;
}

// ShouldUpdate types
export type ShouldUpdateAction = {
  type: 'SET_SHOULD_UPDATE';
  payload: boolean;
};

// ============================================================================
// GLOBAL ATOMS - Application-wide state
// ============================================================================

/**
 * Global pagination state atom - replaces PaginationContext
 * Maintains exact same structure as original context
 */
const initialPaginationState: PaginationState = {
  default: {
    id: 'default',
    currentPage: 1,
    totalPages: 1,
    pageSize: PageSize.TEN
  }
};

export const paginationStateAtom = atom<PaginationState>(
  initialPaginationState
);

/**
 * Global update trigger atom - replaces ShouldUpdateContext
 */
export const shouldUpdateAtom = atom<boolean>(false);

/**
 * Global session state atom (optional, for caching)
 */
export const sessionCacheAtom = atomWithStorage<any>('session-cache', null);

/**
 * Avatar cache atom - stores generated avatar SVGs to prevent regeneration
 * v2: Changed from lorelei to adventurer style - cache key updated to force regeneration
 */
export const avatarCacheAtom = atomWithStorage<Record<string, string>>(
  'avatar-cache-v2-adventurer',
  {}
);

// ============================================================================
// PAGINATION ACTIONS - Exact match to PaginationContext reducer
// ============================================================================

/**
 * Pagination reducer logic as atom actions
 * Maintains exact same behavior as original context
 */
const getCurrentPage = (currentPage?: number) => Math.max(currentPage ?? 1, 1);
const getTotalPages = (totalPages?: number) => Math.max(totalPages ?? 1, 1);

export const paginationActionAtom = atom(
  null,
  (get, set, action: PaginationAction) => {
    const state = get(paginationStateAtom);

    switch (action.type) {
      case 'SET_CURRENT_PAGE':
        set(paginationStateAtom, {
          ...state,
          [action.payload.id]: {
            ...state[action.payload.id],
            id: action.payload.id,
            currentPage: getCurrentPage(action.payload.currentPage)
          }
        });
        break;
      case 'SET_TOTAL_PAGES':
        set(paginationStateAtom, {
          ...state,
          [action.payload.id]: {
            ...state[action.payload.id],
            id: action.payload.id,
            totalPages: getTotalPages(action.payload.totalPages)
          }
        });
        break;
      case 'SET_PAGE_SIZE':
        set(paginationStateAtom, {
          ...state,
          [action.payload.id]: {
            ...state[action.payload.id],
            id: action.payload.id,
            pageSize:
              action.payload.pageSize ||
              state[action.payload.id]?.pageSize ||
              PageSize.TEN
          }
        });
        break;
      case 'RESET_STATE':
        set(paginationStateAtom, initialPaginationState);
        break;
    }
  }
);

/**
 * Should update action atom - replaces ShouldUpdateContext dispatch
 */
export const shouldUpdateActionAtom = atom(
  null,
  (get, set, action: ShouldUpdateAction) => {
    switch (action.type) {
      case 'SET_SHOULD_UPDATE':
        set(shouldUpdateAtom, action.payload);
        break;
    }
  }
);

// ============================================================================
// ATOM REGISTRIES - Per-context state management
// ============================================================================

/**
 * Registry for submissions state atoms by context
 */
class SubmissionsStateAtomRegistry {
  private static instance: SubmissionsStateAtomRegistry;
  private atoms = new Map<string, ReturnType<typeof atom<SubmissionsState>>>();

  static getInstance(): SubmissionsStateAtomRegistry {
    if (!SubmissionsStateAtomRegistry.instance) {
      SubmissionsStateAtomRegistry.instance =
        new SubmissionsStateAtomRegistry();
    }
    return SubmissionsStateAtomRegistry.instance;
  }

  getAtom(contextId: string) {
    if (!this.atoms.has(contextId)) {
      this.atoms.set(
        contextId,
        atom<SubmissionsState>({
          loading: false,
          data: undefined,
          error: undefined
        })
      );
    }
    return this.atoms.get(contextId)!;
  }

  clearAtom(contextId: string) {
    this.atoms.delete(contextId);
  }
}

/**
 * Registry for submissions filters atoms by context
 */
class SubmissionsFiltersAtomRegistry {
  private static instance: SubmissionsFiltersAtomRegistry;
  private atoms = new Map<
    string,
    ReturnType<typeof atomWithStorage<SubmissionsFilters>>
  >();

  static getInstance(): SubmissionsFiltersAtomRegistry {
    if (!SubmissionsFiltersAtomRegistry.instance) {
      SubmissionsFiltersAtomRegistry.instance =
        new SubmissionsFiltersAtomRegistry();
    }
    return SubmissionsFiltersAtomRegistry.instance;
  }

  private getStorageKey(contextId: string): string {
    // Create route-scoped storage key based on context ID
    // This ensures consistent storage keys regardless of when the atom is created
    const routeMap: Record<string, string> = {
      [CONTEXT_IDS.POSTS.toString()]: '/posts',
      [CONTEXT_IDS.MY_POSTS.toString()]: '/my-posts',
      [CONTEXT_IDS.THREAD.toString()]: '/thread',
      [CONTEXT_IDS.ADMIN_POSTS.toString()]: '/admin'
    };

    const route = routeMap[contextId] || '/posts'; // Default to /posts if no mapping
    const storageKey = `filters-${route}-${contextId}`;

    // Debug logging to help verify the fix
    if (typeof window !== 'undefined') {
      console.log('🔑 Filter storage key generated:', {
        contextId,
        route,
        storageKey,
        currentPath: window.location.pathname,
        localStorage: localStorage.getItem(storageKey)
      });
    }

    return storageKey;
  }

  getAtom(contextId: string) {
    if (!this.atoms.has(contextId)) {
      const storageKey = this.getStorageKey(contextId);
      const defaultValue: SubmissionsFilters = {
        onlyMine: false,
        userId: '',
        filters: [],
        page: 1,
        pageSize: 10,
        initialized: false
      };

      // Create the atom with storage
      const atom = atomWithStorage<SubmissionsFilters>(
        storageKey,
        defaultValue
      );

      // Debug logging for atom creation
      if (typeof window !== 'undefined') {
        console.log('🔧 Creating filter atom:', {
          contextId,
          storageKey,
          defaultValue,
          existingValue: localStorage.getItem(storageKey)
        });
      }

      this.atoms.set(contextId, atom);
    }
    return this.atoms.get(contextId)!;
  }

  clearAtom(contextId: string) {
    // Clear from memory
    this.atoms.delete(contextId);

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      const storageKey = this.getStorageKey(contextId);
      localStorage.removeItem(storageKey);
    }
  }

  // Clear all route-scoped filters (for logout/cache clearing)
  clearAllRouteFilters() {
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('filters-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    // Clear memory atoms
    this.atoms.clear();
  }
}

/**
 * Registry for display filters atoms by context
 */
class DisplayFiltersAtomRegistry {
  private static instance: DisplayFiltersAtomRegistry;
  private atoms = new Map<string, any>();

  static getInstance(): DisplayFiltersAtomRegistry {
    if (!DisplayFiltersAtomRegistry.instance) {
      DisplayFiltersAtomRegistry.instance = new DisplayFiltersAtomRegistry();
    }
    return DisplayFiltersAtomRegistry.instance;
  }

  getAtom(contextId: string) {
    if (!this.atoms.has(contextId)) {
      const filtersAtom = getSubmissionsFiltersAtom(contextId);
      this.atoms.set(
        contextId,
        atom(
          (get) => get(filtersAtom).filters,
          (get, set, newFilters: Filter[]) => {
            const current = get(filtersAtom);
            set(filtersAtom, {
              ...current,
              filters: newFilters,
              page: 1 // Reset to page 1 when filters change
            });
          }
        )
      );
    }
    return this.atoms.get(contextId)!;
  }

  clearAtom(contextId: string) {
    this.atoms.delete(contextId);
  }
}

// ============================================================================
// PUBLIC API - Interface Segregation Principle
// ============================================================================

/**
 * Get submissions state atom for a specific context
 */
export const getSubmissionsStateAtom = (contextId: string) => {
  return SubmissionsStateAtomRegistry.getInstance().getAtom(contextId);
};

/**
 * Get submissions filters atom for a specific context
 */
export const getSubmissionsFiltersAtom = (contextId: string) => {
  return SubmissionsFiltersAtomRegistry.getInstance().getAtom(contextId);
};

/**
 * Get display filters atom for a specific context
 */
export const getDisplayFiltersAtom = (contextId: string) => {
  return DisplayFiltersAtomRegistry.getInstance().getAtom(contextId);
};

// ============================================================================
// COMPUTED ATOMS - Derived state
// ============================================================================

/**
 * Computed pagination state with derived values
 */
export const createPaginationComputedAtom = (contextId: string) => {
  return atom((get) => {
    const state = get(paginationStateAtom);
    const pagination = state[contextId];

    if (!pagination) {
      return {
        id: contextId,
        currentPage: 1,
        totalPages: 1,
        pageSize: PageSize.TEN,
        hasNextPage: false,
        hasPreviousPage: false,
        isFirstPage: true,
        isLastPage: true
      };
    }

    return {
      ...pagination,
      hasNextPage: (pagination.currentPage ?? 1) < (pagination.totalPages ?? 1),
      hasPreviousPage: (pagination.currentPage ?? 1) > 1,
      isFirstPage: (pagination.currentPage ?? 1) === 1,
      isLastPage: (pagination.currentPage ?? 1) === (pagination.totalPages ?? 1)
    };
  });
};

/**
 * Computed submissions state with derived values
 */
export const createSubmissionsComputedAtom = (contextId: string) => {
  const stateAtom = getSubmissionsStateAtom(contextId);
  const filtersAtom = getSubmissionsFiltersAtom(contextId);

  return atom((get) => {
    const state = get(stateAtom);
    const filters = get(filtersAtom);

    return {
      ...state,
      totalPages: state.data?.pagination.totalRecords
        ? Math.ceil(
            state.data.pagination.totalRecords / state.data.pagination.pageSize
          )
        : 0,
      currentPage: filters.page,
      pageSize: filters.pageSize,
      hasData: !!state.data?.submissions.length,
      isEmpty: !state.loading && !state.data?.submissions.length
    };
  });
};

// ============================================================================
// UTILITY FUNCTIONS - Dependency Inversion Principle
// ============================================================================

/**
 * Initialize pagination state from URL parameters
 * Respects server-side rendering and maintains exact PaginationProvider behavior
 */
export const initializePaginationFromUrl = (
  contextId: string,
  searchParams: URLSearchParams
): PaginationState => {
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');

  // Parse and validate pageSize
  let pageSize = PageSize.TEN;
  if (pageSizeParam) {
    const parsed = parseInt(pageSizeParam);
    if (
      !isNaN(parsed) &&
      Object.values(PageSize).includes(parsed as PageSize)
    ) {
      pageSize = parsed as PageSize;
    }
  }

  return {
    [contextId]: {
      id: contextId,
      currentPage: pageParam ? Math.max(1, parseInt(pageParam)) : 1,
      totalPages: 1, // Will be updated when data loads
      pageSize
    }
  };
};

/**
 * Initialize filters state from URL parameters and props
 * Maintains security through input validation
 */
export const initializeFiltersFromUrl = (
  contextId: string,
  searchParams: URLSearchParams,
  onlyMine: boolean,
  userId: string,
  initialFilters: Filter[] = []
) => {
  const pageParam = searchParams.get('page');
  const tagsParam = searchParams.get('tags');
  const authorParam = searchParams.get('author');
  const pageSizeParam = searchParams.get('pageSize');

  // Validate and sanitize tags parameter using unified utilities
  const sanitizedTags = tagsParam
    ? (() => {
        const {
          normalizeTagForDatabase,
          formatTagForDisplay
        } = require('../utils/string/tag-utils');
        return tagsParam
          .split(',')
          .map((tag) => normalizeTagForDatabase(tag))
          .filter(Boolean)
          .map(formatTagForDisplay)
          .join(',');
      })()
    : '';

  // Validate and sanitize author parameter
  const sanitizedAuthor = authorParam
    ? authorParam.trim().slice(0, 100) // Limit length and trim
    : '';

  // Build filters array
  const filters: Filter[] = [];

  if (sanitizedTags) {
    filters.push({ name: 'tags', value: sanitizedTags });
  }

  if (sanitizedAuthor) {
    filters.push({ name: 'author', value: sanitizedAuthor });
  }

  // If no filters from URL, use initial filters
  const finalFilters = filters.length > 0 ? filters : initialFilters;

  return {
    onlyMine,
    userId,
    filters: finalFilters,
    page: pageParam ? Math.max(1, parseInt(pageParam)) : 1,
    pageSize: pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 10,
    initialized: true
  };
};

/**
 * Add a new submission to the beginning of the submissions list
 * for optimistic updates
 */
export const addSubmissionToList = (contextId: string, submission: any) => {
  const stateAtom = getSubmissionsStateAtom(contextId);

  return atom(null, (get, set) => {
    const currentState = get(stateAtom);

    if (currentState.data) {
      const updatedSubmissions = [submission, ...currentState.data.submissions];
      const updatedPagination = {
        ...currentState.data.pagination,
        totalRecords: currentState.data.pagination.totalRecords + 1
      };

      set(stateAtom, {
        ...currentState,
        data: {
          submissions: updatedSubmissions,
          pagination: updatedPagination
        }
      });
    }
  });
};

/**
 * Update a specific submission in the submissions list
 * for optimistic updates after edit operations
 */
export const updateSubmissionInList = (
  contextId: string,
  submissionId: number,
  updatedSubmission: any
) => {
  const stateAtom = getSubmissionsStateAtom(contextId);

  return atom(null, (get, set) => {
    const currentState = get(stateAtom);

    if (currentState.data) {
      const updatedSubmissions = currentState.data.submissions.map(
        (submission) =>
          submission.submission_id === submissionId
            ? { ...submission, ...updatedSubmission }
            : submission
      );

      set(stateAtom, {
        ...currentState,
        data: {
          submissions: updatedSubmissions,
          pagination: currentState.data.pagination
        }
      });
    }
  });
};

/**
 * Remove a submission from the submissions list
 * for optimistic updates after delete operations
 */
export const removeSubmissionFromList = (
  contextId: string,
  submissionId: number
) => {
  const stateAtom = getSubmissionsStateAtom(contextId);

  return atom(null, (get, set) => {
    const currentState = get(stateAtom);

    if (currentState.data) {
      const updatedSubmissions = currentState.data.submissions.filter(
        (submission) => submission.submission_id !== submissionId
      );
      const updatedPagination = {
        ...currentState.data.pagination,
        totalRecords: Math.max(0, currentState.data.pagination.totalRecords - 1)
      };

      set(stateAtom, {
        ...currentState,
        data: {
          submissions: updatedSubmissions,
          pagination: updatedPagination
        }
      });
    }
  });
};

/**
 * Clear all atoms for a specific context
 * Useful for cleanup and testing
 */
export const clearContextAtoms = (contextId: string) => {
  SubmissionsStateAtomRegistry.getInstance().clearAtom(contextId);
  SubmissionsFiltersAtomRegistry.getInstance().clearAtom(contextId);
  DisplayFiltersAtomRegistry.getInstance().clearAtom(contextId);
};

/**
 * Clear all route-scoped filters (for logout/cache clearing)
 */
export const clearAllRouteFilters = () => {
  SubmissionsFiltersAtomRegistry.getInstance().clearAllRouteFilters();
};

// ============================================================================
// SUBMISSIONS MANAGEMENT ATOMS - Enhanced for better coordination
// ============================================================================

/**
 * Fetch status atom to prevent race conditions
 */
export const fetchStatusAtom = atom<'idle' | 'pending' | 'fetching'>('idle');

/**
 * Derived atom that triggers fetches when filters/page change
 * This eliminates the need for complex useEffect coordination
 */
export const fetchTriggerAtom = atom((get) => {
  const filters = get(getSubmissionsFiltersAtom('default'));
  const status = get(fetchStatusAtom);

  // Only return trigger data if not already fetching
  if (status === 'fetching') return null;

  return {
    filters: filters.filters,
    page: filters.page,
    pageSize: filters.pageSize,
    timestamp: Date.now() // Force re-evaluation
  };
});

/**
 * Write-only atom for triggering fetches
 * This replaces the complex fetchSubmissions coordination
 */
export const triggerFetchAtom = atom(
  null,
  async (
    get,
    set,
    params: {
      contextId: string;
      fetchFn: (
        filters: Filter<PostFilters>[],
        page: number,
        pageSize: number
      ) => Promise<any>;
      onlyMine?: boolean;
      userId?: string;
      includeThreadReplies?: boolean;
    }
  ) => {
    const currentStatus = get(fetchStatusAtom);
    if (currentStatus === 'fetching') return; // Prevent double fetch

    set(fetchStatusAtom, 'fetching');

    try {
      const filtersState = get(getSubmissionsFiltersAtom(params.contextId));
      const submissionsState = get(getSubmissionsStateAtom(params.contextId));

      // Set loading state
      set(getSubmissionsStateAtom(params.contextId), {
        ...submissionsState,
        loading: true,
        error: undefined
      });

      // Execute the fetch
      const result = await params.fetchFn(
        filtersState.filters as Filter<PostFilters>[],
        filtersState.page,
        filtersState.pageSize
      );

      // Update with results
      if (result.data) {
        set(getSubmissionsStateAtom(params.contextId), {
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
      } else {
        set(getSubmissionsStateAtom(params.contextId), {
          loading: false,
          data: undefined,
          error: result.error || 'Failed to fetch submissions'
        });
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      set(getSubmissionsStateAtom(params.contextId), {
        loading: false,
        data: undefined,
        error: error.message || 'Failed to fetch submissions'
      });
    } finally {
      set(fetchStatusAtom, 'idle');
    }
  }
);

/**
 * URL synchronization atom - handles URL updates when filters change
 */
export const urlSyncAtom = atom(
  null,
  (
    get,
    set,
    params: {
      contextId: string;
      router: any;
      pathname: string;
      infiniteScroll?: boolean;
    }
  ) => {
    const filtersState = get(getSubmissionsFiltersAtom(params.contextId));
    const urlParams = new URLSearchParams();

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

    // Add pagination only if not in infinite scroll mode
    if (!params.infiniteScroll) {
      if (filtersState.page > 1) {
        urlParams.set('page', filtersState.page.toString());
      }
      if (filtersState.pageSize !== 10) {
        urlParams.set('pageSize', filtersState.pageSize.toString());
      }
    }

    const newUrl = `${params.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    params.router.push(newUrl, { scroll: false });
  }
);

/**
 * Batched filter update atom - replaces manual batching
 */
export const batchedFilterUpdateAtom = atom(
  null,
  (get, set, update: { contextId: string; filters: Filter<PostFilters>[] }) => {
    const current = get(getSubmissionsFiltersAtom(update.contextId));

    // Jotai automatically batches these updates
    set(getSubmissionsFiltersAtom(update.contextId), {
      ...current,
      filters: update.filters,
      page: 1 // Reset to first page
    });

    // Note: Fetch will be triggered by the derived atom when needed
  }
);

// ============================================================================
// ENHANCED ATOMIC SOLUTION - Full Jotai Integration
// ============================================================================

/**
 * Configuration atom for each submissions context
 */
export interface SubmissionsConfig {
  contextId: string;
  onlyMine: boolean;
  userId: string;
  includeThreadReplies: boolean;
  infiniteScroll: boolean;
  fetchFn: (
    filters: Filter<PostFilters>[],
    page: number,
    pageSize: number
  ) => Promise<any>;
}

class SubmissionsConfigAtomRegistry {
  private static instance: SubmissionsConfigAtomRegistry;
  private atoms = new Map<
    string,
    ReturnType<typeof atom<SubmissionsConfig | null>>
  >();

  static getInstance(): SubmissionsConfigAtomRegistry {
    if (!SubmissionsConfigAtomRegistry.instance) {
      SubmissionsConfigAtomRegistry.instance =
        new SubmissionsConfigAtomRegistry();
    }
    return SubmissionsConfigAtomRegistry.instance;
  }

  getAtom(contextId: string) {
    if (!this.atoms.has(contextId)) {
      this.atoms.set(contextId, atom<SubmissionsConfig | null>(null));
    }
    return this.atoms.get(contextId)!;
  }

  clearAtom(contextId: string) {
    this.atoms.delete(contextId);
  }
}

export const getSubmissionsConfigAtom = (contextId: string) => {
  return SubmissionsConfigAtomRegistry.getInstance().getAtom(contextId);
};

/**
 * URL parameters atom - derived from current URL
 */
export const urlParamsAtom = atom<URLSearchParams>(new URLSearchParams());

/**
 * Derived atom that extracts filters from URL parameters
 */
export const filtersFromUrlAtom = atom((get) => {
  const urlParams = get(urlParamsAtom);
  const filters: Filter<PostFilters>[] = [];

  const tagsParam = urlParams.get('tags');
  const authorParam = urlParams.get('author');
  const mentionsParam = urlParams.get('mentions');
  const tagLogicParam = urlParams.get('tagLogic');
  const globalLogicParam = urlParams.get('globalLogic');

  if (tagsParam) {
    const cleanTags = tagsParam
      .split(',')
      .map((tag) => tag.trim())
      .map((tag) => {
        const {
          formatTagForDisplay,
          normalizeTagForDatabase
        } = require('../utils/string/tag-utils');
        return formatTagForDisplay(normalizeTagForDatabase(tag));
      })
      .filter(Boolean);
    if (cleanTags.length > 0) {
      filters.push({
        name: 'tags' as PostFilters,
        value: cleanTags.join(',')
      });

      if (cleanTags.length > 1 && !tagLogicParam) {
        filters.push({
          name: 'tagLogic' as PostFilters,
          value: 'OR'
        });
      }
    }
  }

  if (authorParam) {
    authorParam.split(',').forEach((value) => {
      if (value.trim()) {
        filters.push({
          name: 'author' as PostFilters,
          value: value.trim()
        });
      }
    });
  }

  if (mentionsParam) {
    mentionsParam.split(',').forEach((value) => {
      if (value.trim()) {
        filters.push({
          name: 'mentions' as PostFilters,
          value: value.trim()
        });
      }
    });
  }

  if (tagLogicParam) {
    filters.push({
      name: 'tagLogic' as PostFilters,
      value: tagLogicParam
    });
  }

  if (globalLogicParam) {
    filters.push({
      name: 'globalLogic' as PostFilters,
      value: globalLogicParam
    });
  }

  return filters;
});

/**
 * Derived atom that extracts pagination from URL parameters
 */
export const paginationFromUrlAtom = atom((get) => {
  const urlParams = get(urlParamsAtom);
  const pageParam = urlParams.get('page');
  const pageSizeParam = urlParams.get('pageSize');

  return {
    page: pageParam ? Math.max(1, parseInt(pageParam)) : 1,
    pageSize: pageSizeParam ? Math.max(10, parseInt(pageSizeParam)) : 10
  };
});

/**
 * Auto-syncing URL atom that updates URL when filters change
 */
export const createAutoUrlSyncAtom = (contextId: string) => {
  return atom(null, (get, set, params: { router: any; pathname: string }) => {
    const config = get(getSubmissionsConfigAtom(contextId));
    const filters = get(createCombinedFiltersAtom(contextId)); // Use combined atom

    if (!config || !filters.initialized || config.infiniteScroll) {
      return;
    }

    const urlParams = new URLSearchParams();

    // Add filters to URL
    const filterGroups = filters.filters.reduce(
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
          const { formatTagsForUrl } = require('../utils/string/tag-utils');
          const allTags = values.flatMap((value) =>
            value.split(',').map((tag) => tag.trim())
          );
          urlParams.set(name, formatTagsForUrl(allTags));
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
    if (filters.page > 1) {
      urlParams.set('page', filters.page.toString());
    }
    if (filters.pageSize !== 10) {
      urlParams.set('pageSize', filters.pageSize.toString());
    }

    const newUrl = `${params.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    params.router.push(newUrl, { scroll: false });
  });
};

/**
 * Infinite scroll state atom
 */
export const createInfiniteScrollAtom = (contextId: string) => {
  return atom({
    data: [] as any[],
    page: 1,
    isLoadingMore: false,
    hasMore: true
  });
};

/**
 * Comprehensive action atoms for filter management
 */
export const createFilterActionsAtom = (contextId: string) => {
  return atom(
    null,
    (
      get,
      set,
      action:
        | { type: 'ADD_FILTER'; filter: Filter<PostFilters> }
        | { type: 'ADD_FILTERS'; filters: Filter<PostFilters>[] }
        | { type: 'REMOVE_FILTER'; name: PostFilters; value?: string }
        | { type: 'REMOVE_TAG'; tag: string }
        | { type: 'CLEAR_FILTERS' }
        | { type: 'SET_PAGE'; page: number }
        | { type: 'SET_PAGE_SIZE'; pageSize: number }
    ) => {
      const current = get(createCombinedFiltersAtom(contextId)); // Use combined atom
      const config = get(getSubmissionsConfigAtom(contextId));

      switch (action.type) {
        case 'ADD_FILTER': {
          const newFilters = [...current.filters, action.filter];
          set(createCombinedFiltersAtom(contextId), {
            ...current,
            filters: newFilters as Filter[],
            page: 1
          });
          break;
        }

        case 'ADD_FILTERS': {
          const newFilters = [...current.filters, ...action.filters];
          set(createCombinedFiltersAtom(contextId), {
            ...current,
            filters: newFilters as Filter[],
            page: 1
          });
          break;
        }

        case 'REMOVE_FILTER': {
          const newFilters = action.value
            ? current.filters.filter(
                (f) => !(f.name === action.name && f.value === action.value)
              )
            : current.filters.filter((f) => f.name !== action.name);

          set(createCombinedFiltersAtom(contextId), {
            ...current,
            filters: newFilters,
            page: 1
          });
          break;
        }

        case 'REMOVE_TAG': {
          const tagsFilter = current.filters.find((f) => f.name === 'tags');
          if (!tagsFilter) return;

          const currentTags = tagsFilter.value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

          const newTags = currentTags.filter((tag) => tag !== action.tag);

          let newFilters = [...current.filters];

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

          set(createCombinedFiltersAtom(contextId), {
            ...current,
            filters: newFilters,
            page: 1
          });
          break;
        }

        case 'CLEAR_FILTERS': {
          set(createCombinedFiltersAtom(contextId), {
            ...current,
            filters: [],
            page: 1
          });

          // Reset infinite scroll if enabled
          if (config?.infiniteScroll) {
            const infiniteScrollAtom = createInfiniteScrollAtom(contextId);
            set(infiniteScrollAtom, {
              data: [],
              page: 1,
              isLoadingMore: false,
              hasMore: true
            });
          }
          break;
        }

        case 'SET_PAGE': {
          set(createCombinedFiltersAtom(contextId), {
            ...current,
            page: action.page
          });
          break;
        }

        case 'SET_PAGE_SIZE': {
          set(createCombinedFiltersAtom(contextId), {
            ...current,
            pageSize: action.pageSize,
            page: 1
          });
          break;
        }
      }

      // Auto-trigger fetch
      const autoFetch = createAutoFetchAtom(contextId);
      set(autoFetch);
    }
  );
};

/**
 * Writable filter state atom for dynamic updates
 */
export const createWritableFiltersAtom = (contextId: string) => {
  return atom<SubmissionsFilters>({
    onlyMine: false,
    userId: '',
    filters: [],
    page: 1,
    pageSize: 10,
    initialized: false
  });
};

/**
 * Combined filters atom that merges URL initialization with dynamic updates
 */
export const createCombinedFiltersAtom = (contextId: string) => {
  const writableAtom = createWritableFiltersAtom(contextId);

  return atom(
    (get) => {
      const config = get(getSubmissionsConfigAtom(contextId));
      const writable = get(writableAtom);

      // If writable is initialized, use it (for dynamic updates)
      if (writable.initialized) {
        return writable;
      }

      // Otherwise, initialize from URL
      const urlFilters = get(filtersFromUrlAtom);
      const urlPagination = get(paginationFromUrlAtom);

      if (!config) {
        return {
          onlyMine: false,
          userId: '',
          filters: [],
          page: 1,
          pageSize: 100,
          initialized: false
        };
      }

      return {
        onlyMine: config.onlyMine,
        userId: config.userId,
        filters: urlFilters as Filter[],
        page: urlPagination.page,
        pageSize: urlPagination.pageSize,
        initialized: true
      };
    },
    (get, set, update: Partial<SubmissionsFilters>) => {
      set(writableAtom, (prev) => ({ ...prev, ...update, initialized: true }));
    }
  );
};

/**
 * Auto-fetching atom that triggers when filters change
 */
export const createAutoFetchAtom = (contextId: string) => {
  return atom(null, async (get, set) => {
    const config = get(getSubmissionsConfigAtom(contextId));
    const filters = get(createCombinedFiltersAtom(contextId)); // Read from combined atom
    const currentStatus = get(fetchStatusAtom);

    if (!config || !filters.initialized || currentStatus === 'fetching') {
      return;
    }

    set(fetchStatusAtom, 'fetching');

    try {
      const submissionsState = get(getSubmissionsStateAtom(contextId));

      // Set loading state
      set(getSubmissionsStateAtom(contextId), {
        ...submissionsState,
        loading: true,
        error: undefined
      });

      // Execute fetch
      const result = await config.fetchFn(
        filters.filters as Filter<PostFilters>[],
        filters.page,
        filters.pageSize
      );

      // Update with results
      if (result.data) {
        set(getSubmissionsStateAtom(contextId), {
          loading: false,
          data: {
            submissions: result.data.data || [],
            pagination: result.data.pagination || {
              currentPage: filters.page,
              pageSize: filters.pageSize,
              totalRecords: 0
            }
          },
          error: undefined
        });
      } else {
        set(getSubmissionsStateAtom(contextId), {
          loading: false,
          data: undefined,
          error: result.error || 'Failed to fetch submissions'
        });
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      set(getSubmissionsStateAtom(contextId), {
        loading: false,
        data: undefined,
        error: error.message || 'Failed to fetch submissions'
      });
    } finally {
      set(fetchStatusAtom, 'idle');
    }
  });
};

// ============================================================================
// DEBUG FUNCTIONS - For testing and debugging
// ============================================================================

/**
 * Debug function to inspect filter storage state
 * Can be called from browser console: window.debugFilters()
 */
export const debugFilters = () => {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment');
    return;
  }

  console.log('🔍 Filter Storage Debug Information:');
  console.log('=====================================');

  // Show all filter-related localStorage keys
  const filterKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('filters-')) {
      filterKeys.push(key);
    }
  }

  console.log('📦 Filter keys in localStorage:', filterKeys);

  // Show the content of each filter key
  filterKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : null;
      console.log(`🔑 ${key}:`, parsed);
    } catch (error) {
      console.log(`❌ Error parsing ${key}:`, error);
    }
  });

  // Show current page context
  console.log('📍 Current context:', {
    pathname: window.location.pathname,
    search: window.location.search,
    contextIds: CONTEXT_IDS
  });

  // Show registry state
  const filtersRegistry = SubmissionsFiltersAtomRegistry.getInstance();
  console.log('🏗️ Registry state:', {
    atomsCount: (filtersRegistry as any).atoms.size,
    atomKeys: Array.from((filtersRegistry as any).atoms.keys())
  });
};

// Make debug function available globally
if (typeof window !== 'undefined') {
  (window as any).debugFilters = debugFilters;
  (window as any).clearAllRouteFilters = clearAllRouteFilters;

  // Test function to add sample filters
  (window as any).testFilterPersistence = (
    contextId = CONTEXT_IDS.POSTS.toString()
  ) => {
    console.log('🧪 Testing filter persistence for context:', contextId);

    const filtersAtom = getSubmissionsFiltersAtom(contextId);
    const registry = SubmissionsFiltersAtomRegistry.getInstance();

    // Get current storage key
    const storageKey = (registry as any).getStorageKey(contextId);
    console.log('🔑 Using storage key:', storageKey);

    // Create test filters
    const testFilters = [
      { name: 'tags', value: '#test,#persistence' },
      { name: 'author', value: 'testuser' }
    ];

    const testData = {
      onlyMine: false,
      userId: '',
      filters: testFilters,
      page: 2,
      pageSize: 20,
      initialized: true
    };

    // Store directly in localStorage to test
    localStorage.setItem(storageKey, JSON.stringify(testData));
    console.log('💾 Stored test data:', testData);

    // Try to read it back
    const retrieved = localStorage.getItem(storageKey);
    console.log('📖 Retrieved data:', retrieved ? JSON.parse(retrieved) : null);

    return { storageKey, testData, retrieved };
  };
}
