// import { useAtom } from 'jotai';
// import { useSession } from 'next-auth/react';
// import { useEffect, useMemo } from 'react';
// import {
//     getSubmissionsFiltersAtom,
//     getSubmissionsStateAtom,
//     shouldUpdateAtom
// } from '../atoms';
// import {
//     UseSubmissionsManagerProps,
//     UseSubmissionsManagerReturn
// } from './types';
// import { useFiltersManager } from './useFiltersManager';
// import { useInfiniteScroll } from './useInfiniteScroll';
// import { useOptimisticUpdates } from './useOptimisticUpdates';
// import { useSubmissionsFetch } from './useSubmissionsFetch';
// import { useUrlSync } from './useUrlSync';

// export function useSubmissionsManager({
//   contextId,
//   onlyMine = false,
//   initialFilters = [],
//   userId: initialUserId,
//   includeThreadReplies = false,
//   infiniteScroll = false
// }: UseSubmissionsManagerProps): UseSubmissionsManagerReturn {
//   const { data: session } = useSession();

//   // Use simple atoms without circular dependencies
//   const [submissionsState, setSubmissionsState] = useAtom(
//     getSubmissionsStateAtom(contextId)
//   );
//   const [filtersState, setFiltersState] = useAtom(
//     getSubmissionsFiltersAtom(contextId)
//   );
//   const [shouldUpdate, setShouldUpdate] = useAtom(shouldUpdateAtom);

//   // User ID with session fallback (internal database ID)
//   const userId = useMemo(() => {
//     return initialUserId || session?.user?.id || '';
//   }, [initialUserId, session?.user?.id]);

//   // Initialize infinite scroll hook
//   const {
//     infiniteData,
//     setInfiniteData,
//     infinitePage,
//     setInfinitePage,
//     isLoadingMore,
//     hasMore,
//     setHasMore,
//     loadMore
//   } = useInfiniteScroll({
//     infiniteScroll,
//     filtersState,
//     submissionsState,
//     onlyMine,
//     userId,
//     includeThreadReplies
//   });

//   // Initialize URL sync hook
//   const { urlParams } = useUrlSync({
//     filtersState,
//     setFiltersState,
//     initialFilters,
//     infiniteScroll
//   });

//   // Initialize data fetching hook
//   const { forceRefresh } = useSubmissionsFetch({
//     filtersState,
//     setSubmissionsState,
//     onlyMine,
//     userId,
//     includeThreadReplies,
//     infiniteScroll,
//     setInfiniteData,
//     setInfinitePage,
//     setHasMore
//   });

//   // Initialize filters management hook
//   const {
//     addFilter,
//     addFilters,
//     removeFilter,
//     removeTag,
//     setPage,
//     setPageSize,
//     clearFilters,
//     updateFilter
//   } = useFiltersManager({
//     setFiltersState,
//     infiniteScroll,
//     setInfiniteData,
//     setInfinitePage,
//     setHasMore
//   });

//   // Initialize optimistic updates hook
//   const { optimisticUpdateSubmission, optimisticRemoveSubmission } =
//     useOptimisticUpdates({
//       submissionsState,
//       setSubmissionsState,
//       infiniteScroll,
//       infiniteData,
//       setInfiniteData
//     });

//   // Listen for shouldUpdate changes (edit/delete operations)
//   useEffect(() => {
//     if (shouldUpdate) {
//       // Reset the shouldUpdate flag first
//       setShouldUpdate(false);
//       // Trigger a fresh fetch
//       forceRefresh();
//     }
//   }, [shouldUpdate, setShouldUpdate, forceRefresh]);

//   // Default pagination
//   const defaultPagination = useMemo(
//     () => ({
//       currentPage: filtersState.page,
//       pageSize: filtersState.pageSize,
//       totalRecords: 0
//     }),
//     [filtersState.page, filtersState.pageSize]
//   );

//   return {
//     // State - return correct data based on mode
//     submissions: infiniteScroll
//       ? infiniteData
//       : submissionsState.data?.submissions || [],
//     pagination: submissionsState.data?.pagination || defaultPagination,
//     isLoading: submissionsState.loading,
//     error: submissionsState.error,
//     filters: filtersState.filters,
//     initialized: filtersState.initialized,

//     // Infinite scroll
//     infiniteData,
//     hasMore,
//     isLoadingMore,
//     loadMore,

//     // Actions
//     addFilter,
//     addFilters,
//     removeFilter,
//     removeTag,
//     setPage,
//     setPageSize,
//     clearFilters,

//     // Optimistic updates
//     optimisticUpdateSubmission,
//     optimisticRemoveSubmission,

//     // Computed values
//     totalFilters: filtersState.filters.length,
//     currentPage: filtersState.page,
//     pageSize: filtersState.pageSize,

//     // New updateFilter function
//     updateFilter
//   };
// }
