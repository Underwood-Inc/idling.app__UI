'use client';

import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSpacingTheme } from '../../../lib/context/SpacingThemeContext';
import { shouldUpdateAtom } from '../../../lib/state/atoms';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
import { CustomFilterInput } from '../filter-bar/CustomFilterInput';
import FilterBar from '../filter-bar/FilterBar';
import Pagination from '../pagination/Pagination';
import { StickyPagination } from '../pagination/StickyPagination';
import { SpacingThemeToggle } from '../spacing-theme-toggle/SpacingThemeToggle';
import { Submission } from '../submission-forms/schema';
import { InstantLink } from '../ui/InstantLink';
import { SubmissionWithReplies } from './actions';

import './PostsManager.css';
import SubmissionsList from './SubmissionsList';

interface PostsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  enableThreadMode?: boolean;
  onNewPostClick?: () => void;
  // Custom renderer for submissions
  renderSubmissionItem?: (props: {
    submission: SubmissionWithReplies;
    onTagClick: (_tag: string) => void;
    onHashtagClick?: (_hashtag: string) => void;
    onMentionClick?: (
      _mention: string,
      _filterType: 'author' | 'mentions'
    ) => void;
    onSubmissionUpdate?: () => void;
    contextId: string;
    optimisticUpdateSubmission?: (
      _submissionId: number,
      _updatedSubmission: Submission
    ) => void;
    optimisticRemoveSubmission?: (_submissionId: number) => void;
  }) => React.ReactNode;
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
  onNewPostClick,
  renderSubmissionItem
}: PostsManagerProps) {
  const { data: session } = useSession();
  const { theme } = useSpacingTheme();
  const [includeThreadReplies, setIncludeThreadReplies] = useState(false);
  const [infiniteScrollMode, setInfiniteScrollMode] = useState(false);

  // Set default filter visibility based on spacing theme
  const getDefaultFilterVisibility = () => {
    return theme === 'cozy'; // Show filters by default in cozy mode, hide in compact mode
  };

  const [showFilters, setShowFilters] = useState(getDefaultFilterVisibility);
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);

  // For my-posts page, always include replies and hide the toggle
  const shouldIncludeReplies = onlyMine || includeThreadReplies;
  const showThreadToggle = !onlyMine; // Hide toggle for my-posts page

  // Memoize the submissions manager call
  const {
    submissions,
    isLoading,
    error,
    filters,
    pagination,
    addFilter,
    addFilters,
    removeFilter,
    removeTag,
    clearFilters,
    setPage,
    setPageSize,
    loadMore,
    isLoadingMore,
    hasMore,
    optimisticUpdateSubmission,
    optimisticRemoveSubmission
  } = useSubmissionsManager({
    contextId,
    onlyMine,
    userId: session?.user?.id || '',
    includeThreadReplies: shouldIncludeReplies,
    infiniteScroll: infiniteScrollMode
  });

  // Set initial filter visibility based on theme (only on mount)
  React.useEffect(() => {
    const defaultVisibility = getDefaultFilterVisibility();
    setShowFilters(defaultVisibility);
  }, []); // Empty dependency array - only run on mount

  // Memoize authorization check
  const isAuthorized = useMemo(() => !!session?.user?.id, [session?.user?.id]);

  // Memoize total pages calculation
  const totalPages = useMemo(
    () => Math.ceil(pagination.totalRecords / pagination.pageSize),
    [pagination.totalRecords, pagination.pageSize]
  );

  // Use refs for stable function references
  const addFilterRef = useRef(addFilter);
  addFilterRef.current = addFilter;

  // Filter handlers without automatic expansion
  const handleAddFilter = useCallback(
    (filter: any) => {
      addFilter(filter);
    },
    [addFilter]
  );

  const handleAddFilters = useCallback(
    (filterList: any[]) => {
      addFilters(filterList);
    },
    [addFilters]
  );

  // Optimize callbacks with useCallback to prevent child re-renders
  const handleTagClick = useCallback(
    (tag: string) => {
      // Ensure consistent formatting with # prefix to match handleHashtagClick
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      addFilter({ name: 'tags', value: formattedTag });
    },
    [addFilter]
  );

  const handleHashtagClick = useCallback(
    (hashtag: string) => {
      // Ensure hashtag has # prefix for consistency with other components
      const formattedHashtag = hashtag.startsWith('#')
        ? hashtag
        : `#${hashtag}`;
      addFilter({ name: 'tags', value: formattedHashtag });
    },
    [addFilter]
  );

  const handleMentionClick = useCallback(
    (mention: string, filterType: 'author' | 'mentions') => {
      addFilter({
        name: filterType,
        value: mention.replace('@', '')
      });
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
    // Trigger a refresh using the shouldUpdateAtom mechanism
    setShouldUpdate(true);
  }, [setShouldUpdate]);

  const handleFilterSuccess = useCallback(() => {
    // This callback is triggered when filters are successfully added
    // Can be used for additional logic if needed
  }, []);

  const handleUpdateFilter = useCallback(
    (name: string, value: string) => {
      // Add or update a filter with the new value
      addFilterRef.current({ name: name as any, value });
    },
    [] // Empty dependency array for stable reference
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
        {/* Top controls row with spacing toggle, pagination toggle, results count, and new post button */}
        <div className="posts-manager__top-controls">
          <div className="posts-manager__display-controls">
            <SpacingThemeToggle />

            {/* Filter Toggle Button */}
            <button
              className={`posts-manager__filter-toggle ${
                showFilters ? 'posts-manager__filter-toggle--active' : ''
              } ${
                filters.length > 0
                  ? 'posts-manager__filter-toggle--has-filters'
                  : ''
              }`}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              title={showFilters ? 'Hide filters' : 'Show filters'}
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
                className={`posts-manager__filter-icon ${showFilters ? 'posts-manager__filter-icon--rotated' : ''}`}
              >
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
              Filters
              {filters.length > 0 && (
                <span className="posts-manager__filter-count">
                  {filters.length}
                </span>
              )}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`posts-manager__chevron ${showFilters ? 'posts-manager__chevron--up' : 'posts-manager__chevron--down'}`}
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>

            {/* Pagination Mode Toggle */}
            <div className="posts-manager__pagination-toggle">
              <label className="posts-manager__pagination-label">Pages:</label>
              <div className="posts-manager__pagination-options">
                <button
                  className={`posts-manager__pagination-button ${
                    !infiniteScrollMode ? 'active' : ''
                  }`}
                  onClick={() => setInfiniteScrollMode(false)}
                  aria-pressed={!infiniteScrollMode}
                >
                  Traditional
                </button>
                <button
                  className={`posts-manager__pagination-button ${
                    infiniteScrollMode ? 'active' : ''
                  }`}
                  onClick={() => setInfiniteScrollMode(true)}
                  aria-pressed={infiniteScrollMode}
                >
                  Infinite
                </button>
              </div>
            </div>
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

          {onNewPostClick && (
            <InstantLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNewPostClick();
              }}
              className="posts-manager__new-post-button instant-link--button"
              aria-disabled={!isAuthorized}
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
            </InstantLink>
          )}
        </div>

        {/* Collapsible Filter Section */}
        <div
          className={`posts-manager__filter-section ${showFilters ? 'posts-manager__filter-section--expanded' : 'posts-manager__filter-section--collapsed'}`}
          aria-hidden={!showFilters}
        >
          <div className="posts-manager__filter-content">
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
              onAddFilters={addFilters}
              onFilterSuccess={handleFilterSuccess}
              className="posts-manager__custom-filter"
            />

            {/* Thread Reply Toggle - Compact */}
            {showThreadToggle && (
              <div className="posts-manager__thread-controls">
                <label className="posts-manager__toggle posts-manager__toggle--compact">
                  <input
                    type="checkbox"
                    checked={includeThreadReplies}
                    onChange={handleToggleThreadReplies}
                    className="posts-manager__checkbox"
                  />
                  <span className="posts-manager__toggle-text">
                    Include thread replies in filters
                  </span>
                  <span
                    className="posts-manager__toggle-hint"
                    title={
                      includeThreadReplies
                        ? 'Filters apply to both main posts and their replies'
                        : 'Filters only apply to main posts (replies shown when expanded)'
                    }
                  >
                    ?
                  </span>
                </label>
              </div>
            )}
          </div>
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
        infiniteScrollMode={infiniteScrollMode}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        optimisticUpdateSubmission={optimisticUpdateSubmission}
        optimisticRemoveSubmission={optimisticRemoveSubmission}
      >
        {renderSubmissionItem}
      </SubmissionsList>

      {/* Pagination */}
      {!isLoading && !error && submissions.length > 0 && (
        <div className="posts-manager__pagination">
          {!infiniteScrollMode ? (
            <>
              <Pagination
                id="submissions"
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                pageSize={pagination.pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
              <StickyPagination
                id="submissions"
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                pageSize={pagination.pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                containerSelector=".posts-manager__pagination"
              />
            </>
          ) : (
            <div className="posts-manager__infinite-scroll">
              {/* Show completion message when no more posts */}
              {!hasMore && submissions.length > 0 && (
                <div className="posts-manager__infinite-info">
                  Showing all {submissions.length} of{' '}
                  {pagination.totalRecords.toLocaleString()} posts
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
});

export default PostsManager;
