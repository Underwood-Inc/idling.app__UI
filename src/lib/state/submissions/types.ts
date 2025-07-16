import { SubmissionWithReplies } from '../../../app/components/submissions-list/types';
import { PostFilters } from '../../types/filters';
import { Filter } from '../atoms';

export interface UseSubmissionsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  initialFilters?: Filter<PostFilters>[];
  initialUserId?: string; // Internal database user ID only
  includeThreadReplies?: boolean;
  infiniteScroll?: boolean;
}

// Use the existing atom types instead of creating new ones
export type {
  SubmissionsFilters as FiltersState,
  SubmissionsState
} from '../atoms';

export interface FetchParams {
  filters: Filter<PostFilters>[];
  page: number;
  pageSize: number;
  onlyMine: boolean;
  userId: string;
  includeThreadReplies: boolean;
}

export interface UseSubmissionsManagerReturn {
  // State
  submissions: SubmissionWithReplies[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
  };
  isLoading: boolean;
  error?: string;
  filters: Filter[];
  initialized: boolean;

  // Infinite scroll
  infiniteData: SubmissionWithReplies[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;

  // Actions
  addFilter: (filter: Filter<PostFilters>) => void;
  addFilters: (filters: Filter<PostFilters>[]) => void;
  removeFilter: (filterName: PostFilters, filterValue?: string) => void;
  removeTag: (tagToRemove: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clearFilters: () => void;

  // Optimistic updates
  optimisticUpdateSubmission: (
    submissionId: number,
    updatedSubmission: any
  ) => void;
  optimisticRemoveSubmission: (submissionId: number) => void;

  // Computed values
  totalFilters: number;
  currentPage: number;
  pageSize: number;

  // New updateFilter function
  updateFilter: (filterName: PostFilters, newValue: string) => void;
}
