'use client';

import { useSession } from 'next-auth/react';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
import FilterBar from '../filter-bar/FilterBar';
import SubmissionsList from './SubmissionsList';

interface PostsManagerProps {
  contextId: string;
  onlyMine?: boolean;
}

/**
 * PostsManager - Single source of truth for submissions state
 * Manages state with useSubmissionsManager and passes data to child components
 * This eliminates duplicate API calls from multiple useSubmissionsManager instances
 */
export default function PostsManager({
  contextId,
  onlyMine = false
}: PostsManagerProps) {
  const { data: session } = useSession();

  // Single instance of useSubmissionsManager
  const {
    isLoading,
    error,
    submissions,
    pagination,
    filters,
    setPage,
    setPageSize,
    addFilter,
    removeFilter,
    removeTag,
    clearFilters,
    totalPages
  } = useSubmissionsManager({
    contextId,
    onlyMine,
    providerAccountId: session?.user?.providerAccountId
  });

  // eslint-disable-next-line no-console
  console.log('📊 [POSTS_MANAGER] Rendering with state:', {
    contextId,
    onlyMine,
    submissionsCount: submissions.length,
    filtersCount: filters.length,
    isLoading,
    hasError: !!error
  });

  return (
    <>
      <FilterBar
        filterId={contextId}
        filters={filters as any}
        onRemoveFilter={removeFilter}
        onRemoveTag={removeTag}
        onClearFilters={clearFilters}
      />
      <SubmissionsList
        isLoading={isLoading}
        error={error || null}
        submissions={submissions}
        pagination={pagination}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onTagClick={addFilter}
      />
    </>
  );
}
