// Import batched updater from separate file
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { CONTEXT_IDS } from '../context-ids';
import { createLogger } from '../logging';
import { PostFilters } from '../types/filters';

// Create logger for atoms state management
const logger = createLogger({
  context: {
    module: 'atoms'
  }
});

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
 * Session data atom - updated automatically from API wrapper responses
 * Contains timeout info and session validation state
 */
export interface SessionData {
  timeoutInfo: {
    is_timed_out: boolean;
    lastValidated: string | null;
    reason: string | null;
    userInfo: {
      id: number;
      username: string;
      email: string;
      is_active: boolean;
    } | null;
    userValidated: boolean;
    expires_at?: Date;
  };
  lastUpdated: string;
  isValid: boolean;
}

export const sessionDataAtom = atom<SessionData | null>(null);

/**
 * Session data update atom - write-only atom to update session data
 */
export const updateSessionDataAtom = atom(
  null,
  (get, set, update: Partial<SessionData>) => {
    const current = get(sessionDataAtom);

    // If no current data, create a new SessionData with defaults
    if (!current) {
      const defaultSessionData: SessionData = {
        timeoutInfo: {
          is_timed_out: false,
          lastValidated: null,
          reason: null,
          userInfo: null,
          userValidated: false
        },
        lastUpdated: new Date().toISOString(),
        isValid: true
      };

      set(sessionDataAtom, {
        ...defaultSessionData,
        ...update,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Update existing data
      set(sessionDataAtom, {
        ...current,
        ...update,
        lastUpdated: new Date().toISOString()
      });
    }
  }
);

// Custom storage for avatar cache with size limits and error handling
const createAvatarCacheStorage = () => {
  const STORAGE_KEY = 'avatar-cache-v3-adventurer';
  const MAX_CACHE_SIZE = 100;

  return {
    getItem: (key: string): Record<string, string> => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};

        const parsed = JSON.parse(stored);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch (error) {
        console.warn('Failed to load avatar cache, clearing:', error);
        localStorage.removeItem(STORAGE_KEY);
        return {};
      }
    },
    setItem: (key: string, value: Record<string, string>): void => {
      try {
        // Limit cache size to prevent quota exceeded errors
        const entries = Object.entries(value);
        if (entries.length > MAX_CACHE_SIZE) {
          // Keep only the most recent entries
          const limitedEntries = entries.slice(-MAX_CACHE_SIZE);
          value = Object.fromEntries(limitedEntries);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('Avatar cache quota exceeded, clearing old entries');
          // Clear the cache and try to store just the current value
          try {
            localStorage.removeItem(STORAGE_KEY);
            const entries = Object.entries(value);
            if (entries.length > 10) {
              // If still too large, keep only 10 most recent
              const limitedEntries = entries.slice(-10);
              value = Object.fromEntries(limitedEntries);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
          } catch (retryError) {
            console.error(
              'Failed to store avatar cache even after cleanup:',
              retryError
            );
          }
        } else {
          console.error('Failed to store avatar cache:', error);
        }
      }
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
};

/**
 * Avatar cache atom - stores generated avatar SVGs to prevent regeneration
 * v3: Added size limits and cleanup to prevent quota exceeded errors
 */
export const avatarCacheAtom = atomWithStorage<Record<string, string>>(
  'avatar-cache-v3-adventurer',
  {},
  createAvatarCacheStorage()
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

// REMOVED: SubmissionsFiltersAtomRegistry - Using URL-first approach instead
// No more localStorage persistence or atom-based filter storage

// REMOVED: DisplayFiltersAtomRegistry - Was dependent on SubmissionsFiltersAtomRegistry

// REMOVED: DisplayFiltersAtomRegistry - Was dependent on SubmissionsFiltersAtomRegistry

// ============================================================================
// PUBLIC API - Interface Segregation Principle
// ============================================================================

/**
 * Get submissions state atom for a specific context
 */
export const getSubmissionsStateAtom = (contextId: string) => {
  return SubmissionsStateAtomRegistry.getInstance().getAtom(contextId);
};

// REMOVED: getSubmissionsFiltersAtom - Using URL-first approach with useSimpleUrlFilters instead
// REMOVED: getDisplayFiltersAtom - Was dependent on getSubmissionsFiltersAtom

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
 * UPDATED: Now uses URL-first approach via createCombinedFiltersAtom
 */
export const createSubmissionsComputedAtom = (contextId: string) => {
  const stateAtom = getSubmissionsStateAtom(contextId);
  const filtersAtom = createCombinedFiltersAtom(contextId); // Use URL-first combined atom

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
  const searchParam = searchParams.get('search');
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

  // Validate and sanitize search parameter
  const sanitizedSearch = searchParam
    ? searchParam.trim().slice(0, 200) // Limit length and trim
    : '';

  // Build filters array - create individual filter entries, not comma-separated
  const filters: Filter[] = [];

  if (sanitizedTags) {
    // Split comma-separated tags into individual filter entries
    const tags = sanitizedTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    tags.forEach((tag) => {
      filters.push({ name: 'tags', value: tag });
    });
  }

  if (sanitizedAuthor) {
    // Split comma-separated authors into individual filter entries
    const authors = sanitizedAuthor
      .split(',')
      .map((author) => author.trim())
      .filter(Boolean);
    authors.forEach((author) => {
      filters.push({ name: 'author', value: author });
    });
  }

  if (sanitizedSearch) {
    filters.push({ name: 'search', value: sanitizedSearch });
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
 * UPDATED: Only clears state atoms since filters are now URL-first
 */
export const clearContextAtoms = (contextId: string) => {
  SubmissionsStateAtomRegistry.getInstance().clearAtom(contextId);
  // REMOVED: DisplayFiltersAtomRegistry - Using URL-first approach instead
};

/**
 * Clear all route-scoped filters (for logout/cache clearing)
 */
export const clearAllRouteFilters = () => {
  // No longer needed with URL-first approach
};

// ============================================================================
// SUBMISSIONS MANAGEMENT ATOMS - Enhanced for better coordination
// ============================================================================

/**
 * Fetch status atom to prevent race conditions
 */
export const fetchStatusAtom = atom<'idle' | 'pending' | 'fetching'>('idle');

// DISABLED: Legacy fetch trigger atom - Using URL-first approach with useSimpleUrlFilters instead
// export const fetchTriggerAtom = atom((get) => {
//   const filters = get(getSubmissionsFiltersAtom('default'));
//   const status = get(fetchStatusAtom);
//   // Only return trigger data if not already fetching
//   if (status === 'fetching') return null;
//   return {
//     filters: filters.filters,
//     page: filters.page,
//     pageSize: filters.pageSize,
//     timestamp: Date.now() // Force re-evaluation
//   };
// });

/**
 * Write-only atom for triggering fetches
 * This replaces the complex fetchSubmissions coordination
 * UPDATED: Now uses URL-first approach via createCombinedFiltersAtom
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
      // Use URL-first combined filters atom instead of old getSubmissionsFiltersAtom
      const filtersState = get(createCombinedFiltersAtom(params.contextId));
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
      logger.error('Fetch error in triggerFetchAtom', error as Error, {
        contextId: params.contextId
      });
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
// Removed: urlSyncAtom - Replaced by direct URL updates in filter actions

// DISABLED: Batched filter update atom - Using URL-first approach with useSimpleUrlFilters instead
// export const batchedFilterUpdateAtom = atom(
//   null,
//   (get, set, update: { contextId: string; filters: Filter<PostFilters>[] }) => {
//     const current = get(getSubmissionsFiltersAtom(update.contextId));
//     // Jotai automatically batches these updates
//     set(getSubmissionsFiltersAtom(update.contextId), {
//       ...current,
//       filters: update.filters,
//       page: 1 // Reset to first page
//     });
//     // Note: Fetch will be triggered by the derived atom when needed
//   }
// );

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
 * URL parameters atom - reactive to browser URL changes
 */
export const urlParamsAtom = atom<URLSearchParams>(
  // Get initial URL params from browser
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
);

/**
 * Derived atom that extracts filters from URL parameters
 */
export const filtersFromUrlAtom = atom((get) => {
  const urlParams = get(urlParamsAtom);
  const filters: Filter<PostFilters>[] = [];

  const tagsParam = urlParams.get('tags');
  const authorParam = urlParams.get('author');
  const mentionsParam = urlParams.get('mentions');
  const searchParam = urlParams.get('search');
  const onlyRepliesParam = urlParams.get('onlyReplies');
  const tagLogicParam = urlParams.get('tagLogic');
  const authorLogicParam = urlParams.get('authorLogic');
  const mentionsLogicParam = urlParams.get('mentionsLogic');
  const searchLogicParam = urlParams.get('searchLogic');
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
      // Create separate filter entries for each tag instead of comma-separated value
      cleanTags.forEach((tagValue) => {
        filters.push({
          name: 'tags' as PostFilters,
          value: tagValue
        });
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
    const cleanAuthors = authorParam
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    // Create separate filter entries for each author instead of comma-separated value
    cleanAuthors.forEach((authorValue) => {
      filters.push({
        name: 'author' as PostFilters,
        value: authorValue
      });
    });
  }

  if (mentionsParam) {
    const cleanMentions = mentionsParam
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    // Create separate filter entries for each mention instead of comma-separated value
    cleanMentions.forEach((mentionValue) => {
      // Handle different mention formats from URL:
      // 1. Plain username: "shaun_beatty"
      // 2. Combined format: "shaun_beatty|122"
      // 3. User ID only: "122"

      let filterValue = mentionValue;

      // If it's already in combined format (username|userId), use as-is
      if (mentionValue.includes('|')) {
        filterValue = mentionValue;
      } else if (/^\d+$/.test(mentionValue)) {
        // If it's a pure user ID, we need to resolve it to username|userId format
        // For now, store as-is and let the display layer handle resolution
        filterValue = mentionValue;
      } else {
        // If it's a plain username, we need to resolve it to username|userId format
        // For now, store as username|username and let the system resolve the user ID later
        filterValue = `${mentionValue}|${mentionValue}`;
      }

      filters.push({
        name: 'mentions' as PostFilters,
        value: filterValue
      });
    });
  }

  if (searchParam) {
    const cleanSearch = searchParam.trim();
    if (cleanSearch) {
      filters.push({
        name: 'search' as PostFilters,
        value: cleanSearch
      });
    }
  }

  if (onlyRepliesParam) {
    const onlyReplies = onlyRepliesParam.trim().toLowerCase();
    if (onlyReplies === 'true' || onlyReplies === '1') {
      filters.push({
        name: 'onlyReplies' as PostFilters,
        value: 'true'
      });
    }
  }

  if (tagLogicParam) {
    filters.push({
      name: 'tagLogic' as PostFilters,
      value: tagLogicParam
    });
  }

  if (authorLogicParam) {
    filters.push({
      name: 'authorLogic' as PostFilters,
      value: authorLogicParam
    });
  }

  if (mentionsLogicParam) {
    filters.push({
      name: 'mentionsLogic' as PostFilters,
      value: mentionsLogicParam
    });
  }

  if (searchLogicParam) {
    filters.push({
      name: 'searchLogic' as PostFilters,
      value: searchLogicParam
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

// Removed: createAutoUrlSyncAtom - Replaced by direct URL updates in filter actions

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
 * URL-first filter actions - DISABLED: Use useSimpleUrlFilters instead
 * This atom is kept for compatibility but doesn't write to URL anymore
 */
export const createFilterActionsAtom = (contextId: string) => {
  return atom(null, (get, set, action: any) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        '⚠️ createFilterActionsAtom DISABLED - use useSimpleUrlFilters for filter management'
      );
    }
    // Do nothing - URL-first system (useSimpleUrlFilters) handles all filter operations
  });
};

// REMOVED: Duplicate URL formatting functions - Now handled by useSimpleUrlFilters.updateUrl
// These functions duplicated the URL formatting logic that already exists in useSimpleUrlFilters
// - updateUrlFromCurrentFilters()
// - updateUrlFromFilters()

// Removed: createWritableFiltersAtom - No longer needed with URL-first approach

/**
 * URL-first combined filters atom - Always derives from URL (single source of truth)
 * This replaces the old getSubmissionsFiltersAtom to make it URL-first
 */
export const createCombinedFiltersAtom = (contextId: string) => {
  return atom(
    // Read from URL (single source of truth)
    (get) => {
      const urlParams = get(urlParamsAtom);
      const config = get(getSubmissionsConfigAtom(contextId));

      // Parse filters from URL
      const filters = get(filtersFromUrlAtom);

      // Parse pagination
      const page = Math.max(1, parseInt(urlParams.get('page') || '1'));
      const pageSize = Math.max(1, parseInt(urlParams.get('pageSize') || '10'));

      return {
        filters,
        page,
        pageSize,
        onlyMine: config?.onlyMine || false,
        userId: config?.userId || '',
        includeThreadReplies: config?.includeThreadReplies || false,
        initialized: true
      };
    },
    // DISABLED: No URL writing - URL-first system handles this
    () => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          '⚠️ createCombinedFiltersAtom write DISABLED - use useSimpleUrlFilters for URL updates'
        );
      }
      // Do nothing - URL-first system (useSimpleUrlFilters) handles URL updates
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
      logger.error('Fetch error in autoFetchAtom', error as Error, {
        contextId
      });
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
    logger.warn('Debug filters called in non-browser environment');
    return;
  }

  logger.group('filterStorageDebug');
  logger.debug('Filter Storage Debug Information');

  // Show all filter-related localStorage keys
  const filterKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('filters-')) {
      filterKeys.push(key);
    }
  }

  logger.debug('Filter keys in localStorage', { filterKeys });

  // Show the content of each filter key
  filterKeys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : null;
      logger.debug('Filter key content', { key, parsed });
    } catch (error) {
      logger.warn('Error parsing filter key', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Show current page context
  logger.debug('Current context', {
    pathname: window.location.pathname,
    search: window.location.search,
    contextIds: CONTEXT_IDS
  });

  // Show registry state
  const filtersRegistry = SubmissionsStateAtomRegistry.getInstance();
  logger.debug('Registry state', {
    atomsCount: (filtersRegistry as any).atoms.size,
    atomKeys: Array.from((filtersRegistry as any).atoms.keys())
  });

  logger.groupEnd();
};

// Make debug function available globally
if (typeof window !== 'undefined') {
  (window as any).debugFilters = debugFilters;
  (window as any).clearAllRouteFilters = clearAllRouteFilters;

  // DISABLED: Test function for filter persistence - No longer relevant with URL-first approach
  // (window as any).testFilterPersistence = (
  //   contextId = CONTEXT_IDS.POSTS.toString()
  // ) => {
  //   logger.debug('Testing filter persistence for context', { contextId });
  //   const filtersAtom = getSubmissionsFiltersAtom(contextId);
  //   const registry = SubmissionsStateAtomRegistry.getInstance();
  //   // ... rest of function disabled since we use URL-first now
  // };
}
