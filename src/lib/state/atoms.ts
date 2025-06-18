// Import batched updater from separate file
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

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
  providerAccountId: string;
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
    ReturnType<typeof atom<SubmissionsFilters>>
  >();

  static getInstance(): SubmissionsFiltersAtomRegistry {
    if (!SubmissionsFiltersAtomRegistry.instance) {
      SubmissionsFiltersAtomRegistry.instance =
        new SubmissionsFiltersAtomRegistry();
    }
    return SubmissionsFiltersAtomRegistry.instance;
  }

  getAtom(contextId: string) {
    if (!this.atoms.has(contextId)) {
      this.atoms.set(
        contextId,
        atom<SubmissionsFilters>({
          onlyMine: false,
          providerAccountId: '',
          filters: [],
          page: 1,
          pageSize: 10,
          initialized: false
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
  providerAccountId: string,
  initialFilters: Filter[] = []
) => {
  const pageParam = searchParams.get('page');
  const tagsParam = searchParams.get('tags');
  const authorParam = searchParams.get('author');
  const pageSizeParam = searchParams.get('pageSize');

  // Validate and sanitize tags parameter - remove any HTML/script tags
  const sanitizedTags = tagsParam
    ? tagsParam
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => {
          // Remove any tags containing HTML/script elements
          return (
            tag.length > 0 &&
            tag.length <= 50 &&
            !tag.includes('<') &&
            !tag.includes('>') &&
            !tag.includes('script') &&
            /^[#a-z0-9\-_]+$/.test(tag) // Allow hashtags and alphanumeric, hyphens, underscores
          );
        })
        .join(',')
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
    providerAccountId,
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
 * Clear all atoms for a specific context
 * Useful for cleanup and testing
 */
export const clearContextAtoms = (contextId: string) => {
  SubmissionsStateAtomRegistry.getInstance().clearAtom(contextId);
  SubmissionsFiltersAtomRegistry.getInstance().clearAtom(contextId);
  DisplayFiltersAtomRegistry.getInstance().clearAtom(contextId);
};
