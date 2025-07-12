import { createLogger } from '@lib/logging';
import { useCallback, useEffect, useState } from 'react';
import { getSubmissionsWithReplies, SubmissionWithReplies } from '../../../app/components/submissions-list/actions';
import { PostFilters } from '../../types/filters';
import { Filter } from '../atoms';
import { FiltersState, SubmissionsState } from './types';

const logger = createLogger({
  context: {
    component: 'useInfiniteScroll',
    module: 'state'
  },
  enabled: true
});

interface UseInfiniteScrollProps {
  infiniteScroll: boolean;
  filtersState: FiltersState;
  submissionsState: SubmissionsState;
  onlyMine: boolean;
  userId: string;
  includeThreadReplies: boolean;
}

export function useInfiniteScroll({
  infiniteScroll,
  filtersState,
  submissionsState,
  onlyMine,
  userId,
  includeThreadReplies
}: UseInfiniteScrollProps) {
  // Local state for infinite scroll
  const [infiniteData, setInfiniteData] = useState<SubmissionWithReplies[]>([]);
  const [infinitePage, setInfinitePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
      logger.error('Error loading more submissions', error as Error, {
        isLoadingMore,
        hasMore,
        submissionsStateLoading: submissionsState.loading,
        infinitePage,
        filtersStateFilters: filtersState.filters,
        filtersStatePageSize: filtersState.pageSize,
        onlyMine,
        userId,
        includeThreadReplies
      });
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

  return {
    infiniteData,
    setInfiniteData,
    infinitePage,
    setInfinitePage,
    isLoadingMore,
    hasMore,
    setHasMore,
    loadMore
  };
} 