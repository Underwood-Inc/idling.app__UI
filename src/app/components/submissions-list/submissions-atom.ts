import { atom } from 'jotai';
import { PostFilters } from '../../posts/page';
import { Filter } from '../filter-bar/FilterBar';
import { Submission } from '../submission-forms/schema';

export type SubmissionsState = {
  loading: boolean;
  data?: {
    submissions: Submission[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalRecords: number;
    };
  };
  error?: string;
};

export type SubmissionsFilters = {
  onlyMine: boolean;
  providerAccountId: string;
  filters: Filter<PostFilters>[];
  page: number;
  pageSize: number;
  initialized: boolean;
};

// Create a map to store atoms for each context
const stateAtoms = new Map<string, ReturnType<typeof atom<SubmissionsState>>>();
const filterAtoms = new Map<
  string,
  ReturnType<typeof atom<SubmissionsFilters>>
>();
const computedAtoms = new Map<string, ReturnType<typeof atom<any>>>();

// Get or create state atom for a context
export const getSubmissionsStateAtom = (contextId: string) => {
  if (!stateAtoms.has(contextId)) {
    stateAtoms.set(
      contextId,
      atom<SubmissionsState>({
        loading: false,
        data: undefined,
        error: undefined
      })
    );
  }
  return stateAtoms.get(contextId)!;
};

// Get or create filters atom for a context
export const getSubmissionsFiltersAtom = (contextId: string) => {
  if (!filterAtoms.has(contextId)) {
    filterAtoms.set(
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
  return filterAtoms.get(contextId)!;
};

// Get computed values for a context
export const getSubmissionsComputedAtom = (contextId: string) => {
  if (!computedAtoms.has(contextId)) {
    const stateAtom = getSubmissionsStateAtom(contextId);
    const filtersAtom = getSubmissionsFiltersAtom(contextId);

    computedAtoms.set(
      contextId,
      atom((get) => {
        const state = get(stateAtom);
        const filters = get(filtersAtom);

        return {
          ...state,
          totalPages: state.data?.pagination.totalRecords
            ? Math.ceil(
                state.data.pagination.totalRecords /
                  state.data.pagination.pageSize
              )
            : 0,
          currentPage: filters.page,
          pageSize: filters.pageSize,
          hasNextPage: state.data?.pagination
            ? filters.page <
              Math.ceil(
                state.data.pagination.totalRecords /
                  state.data.pagination.pageSize
              )
            : false,
          hasPreviousPage: filters.page > 1
        };
      })
    );
  }
  return computedAtoms.get(contextId)!;
};
