'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
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
export default function PostsManager({
  contextId,
  onlyMine = false,
  enableThreadMode = false,
  onNewPostClick
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
    setIncludeThreadReplies((prev) => {
      const newValue = !prev;
      // eslint-disable-next-line no-console
      console.log('🔧 [POSTS_MANAGER] Toggle includeThreadReplies:', {
        from: prev,
        to: newValue,
        hasFilters: filters.length > 0,
        currentFilters: filters
      });
      return newValue;
    });
  };

  const handleNewPostClick = () => {
    if (onNewPostClick) {
      onNewPostClick();
    }
  };

  const handleTagClick = (tag: string) => {
    // Convert tag string to filter format
    addFilter({ name: 'tags' as const, value: tag });
  };

  const handleHashtagClick = (hashtag: string) => {
    // Filter by hashtag in title or content
    addFilter({ name: 'tags' as const, value: hashtag });
  };

  const handleMentionClick = (mention: string) => {
    // Filter by author mention - use the mention value directly
    // The backend will handle both author_id and author name matching
    addFilter({ name: 'author' as const, value: mention });
  };

  const handleRefresh = () => {
    // Force a refresh by toggling includeThreadReplies
    setIncludeThreadReplies((prev) => {
      // Toggle and immediately toggle back to force refetch
      setTimeout(() => setIncludeThreadReplies(prev), 50);
      return !prev;
    });
  };

  const isAuthorized = !!session?.user?.providerAccountId;

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
}
