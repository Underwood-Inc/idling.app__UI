'use client';

import { useSession } from 'next-auth/react';
import React, { useCallback, useMemo, useState } from 'react';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
import { CustomFilterInput } from '../filter-bar/CustomFilterInput';
import FilterBar from '../filter-bar/FilterBar';
import Pagination from '../pagination/Pagination';
import { SpacingThemeToggle } from '../spacing-theme-toggle/SpacingThemeToggle';

import './PostsManager.css';
import SubmissionsList from './SubmissionsList';

interface PostsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  enableThreadMode?: boolean;
  onNewPostClick?: () => void;
}

/**
 * PostsManager - Single source of truth for submissions state
 * Manages state with useSubmissionsManager and passes data to child components
 * This eliminates duplicate API calls from multiple useSubmissionsManager instances
 */
const PostsManager = React.memo(function PostsManager({
  contextId,
  onlyMine = false,
  enableThreadMode = false,
  onNewPostClick
}: PostsManagerProps) {
  const { data: session } = useSession();
  const [includeThreadReplies, setIncludeThreadReplies] = useState(false);

  // Memoize the submissions manager call
  const {
    submissions,
    isLoading,
    error,
    filters,
    pagination,
    addFilter,
    removeFilter,
    removeTag,
    clearFilters,
    setPage,
    setPageSize
  } = useSubmissionsManager({
    contextId,
    onlyMine,
    providerAccountId: session?.user?.providerAccountId || '',
    includeThreadReplies
  });

  // Memoize authorization check
  const isAuthorized = useMemo(
    () => !!session?.user?.providerAccountId,
    [session?.user?.providerAccountId]
  );

  // Memoize total pages calculation
  const totalPages = useMemo(
    () => Math.ceil(pagination.totalRecords / pagination.pageSize),
    [pagination.totalRecords, pagination.pageSize]
  );

  // Optimize callbacks with useCallback to prevent child re-renders
  const handleTagClick = useCallback(
    (tag: string) => {
      addFilter({ name: 'tags', value: tag });
    },
    [addFilter]
  );

  const handleHashtagClick = useCallback(
    (hashtag: string) => {
      addFilter({ name: 'tags', value: hashtag.replace('#', '') });
    },
    [addFilter]
  );

  const handleMentionClick = useCallback(
    (mention: string, filterType: 'author' | 'mentions') => {
      addFilter({ name: filterType, value: mention.replace('@', '') });
    },
    [addFilter]
  );

  const handleToggleThreadReplies = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIncludeThreadReplies(e.target.checked);
    },
    []
  );

  const handleNewPostClick = useCallback(() => {
    if (onNewPostClick) {
      onNewPostClick();
    }
  }, [onNewPostClick]);

  const handleRefresh = useCallback(() => {
    // Force a refresh by toggling includeThreadReplies briefly
    setIncludeThreadReplies((prev) => !prev);
    // Toggle and immediately toggle back to force refetch
    setTimeout(() => setIncludeThreadReplies((prev) => !prev), 10);
  }, []);

  const handleUpdateFilter = useCallback(
    (name: string, value: string) => {
      // Add or update a filter with the new value
      addFilter({ name: name as any, value });
    },
    [addFilter]
  );

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

  return (
    <>
      <div className="posts-manager__controls">
        {/* Top controls row with spacing toggle on left, new post button on right */}
        <div className="posts-manager__top-controls">
          <SpacingThemeToggle />

          {onNewPostClick && (
            <button
              className="posts-manager__new-post-button"
              onClick={handleNewPostClick}
              disabled={!isAuthorized}
              title={
                isAuthorized ? 'Create a new post' : 'Login to create posts'
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Post
            </button>
          )}
        </div>

        {/* Results count display */}
        {!isLoading && !error && (
          <div className="posts-manager__results-count">
            <span className="posts-manager__results-text">
              {pagination.totalRecords === 0
                ? 'No results found'
                : `${pagination.totalRecords.toLocaleString()} result${
                    pagination.totalRecords === 1 ? '' : 's'
                  }`}
              {filters.length > 0 && (
                <span className="posts-manager__results-filtered">
                  {' '}
                  (filtered)
                </span>
              )}
            </span>
          </div>
        )}

        <FilterBar
          filterId={contextId}
          filters={filters as any}
          onRemoveFilter={removeFilter}
          onRemoveTag={removeTag}
          onClearFilters={clearFilters}
          onUpdateFilter={handleUpdateFilter}
        />

        {/* Custom Filter Input */}
        <CustomFilterInput
          contextId={contextId}
          onAddFilter={addFilter}
          className="posts-manager__custom-filter"
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

      {error && (
        <div className="posts-manager__error">
          <p>Error loading posts: {error}</p>
          <button onClick={handleRefresh}>Try Again</button>
        </div>
      )}

      <SubmissionsList
        posts={submissions}
        onTagClick={handleTagClick}
        onHashtagClick={handleHashtagClick}
        onMentionClick={handleMentionClick}
        showSkeletons={isLoading}
        onRefresh={handleRefresh}
        contextId={contextId}
      />

      {!isLoading && !error && submissions.length === 0 && (
        <div className="posts-manager__empty">
          <p>No posts found.</p>
          {filters.length > 0 && (
            <button onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && submissions.length > 0 && (
        <div className="posts-manager__pagination">
          <Pagination
            id="submissions"
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </>
  );
});

export default PostsManager;
