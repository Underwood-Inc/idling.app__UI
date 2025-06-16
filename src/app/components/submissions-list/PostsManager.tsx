'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
import FilterBar from '../filter-bar/FilterBar';
import './PostsManager.css';
import SubmissionsList from './SubmissionsList';

interface PostsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  enableThreadMode?: boolean;
}

/**
 * PostsManager - Single source of truth for submissions state
 * Manages state with useSubmissionsManager and passes data to child components
 * This eliminates duplicate API calls from multiple useSubmissionsManager instances
 */
export default function PostsManager({
  contextId,
  onlyMine = false,
  enableThreadMode = false
}: PostsManagerProps) {
  const { data: session } = useSession();
  const [includeThreadReplies, setIncludeThreadReplies] = useState(false);

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
    providerAccountId: session?.user?.providerAccountId,
    includeThreadReplies
  });

  // eslint-disable-next-line no-console
  console.log('📊 [POSTS_MANAGER] Rendering with state:', {
    contextId,
    onlyMine,
    enableThreadMode,
    includeThreadReplies,
    submissionsCount: submissions.length,
    filtersCount: filters.length,
    isLoading,
    hasError: !!error
  });

  const handleToggleThreadReplies = () => {
    setIncludeThreadReplies((prev) => !prev);
  };

  return (
    <>
      <div className="posts-manager__controls">
        <FilterBar
          filterId={contextId}
          filters={filters as any}
          onRemoveFilter={removeFilter}
          onRemoveTag={removeTag}
          onClearFilters={clearFilters}
        />

        {/* Thread Reply Toggle */}
        <div className="posts-manager__thread-controls">
          <label className="posts-manager__toggle">
            <input
              type="checkbox"
              checked={includeThreadReplies}
              onChange={handleToggleThreadReplies}
              className="posts-manager__checkbox"
            />
            <span className="posts-manager__toggle-text">
              Include thread replies when filtering/searching
            </span>
          </label>
          <small className="posts-manager__help-text">
            {includeThreadReplies
              ? 'Filters and searches will apply to both main posts and their replies'
              : 'Filters only apply to main posts (replies always shown nested when expanded)'}
          </small>
        </div>
      </div>

      <SubmissionsList
        isLoading={isLoading}
        error={error || null}
        submissions={submissions}
        pagination={pagination}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onTagClick={addFilter}
        enableThreadMode={enableThreadMode}
      />
    </>
  );
}
