'use client';

import { createLogger } from '@/lib/logging';
import { useSession } from 'next-auth/react';
import React, { useMemo } from 'react';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
import '../../../lib/utils/scroll-highlight-demo'; // Import for global test function
import { Submission } from '../submission-forms/schema';
import { SubmissionWithReplies } from './actions';

import './PostsManager.css';
import { StickyPostsControls } from './StickyPostsControls';
import SubmissionsList from './SubmissionsList';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'PostsManager'
  }
});

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
    currentPage?: number;
    currentFilters?: Record<string, any>;
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

  // Use custom hooks for state management
  const {
    includeThreadReplies,
    setIncludeThreadReplies,
    isMobile,
    infiniteScrollMode,
    setInfiniteScrollMode,
    showFilters,
    setShowFilters
  } = usePostsManagerState();

  // For my-posts page, always include replies and hide the toggle
  const shouldIncludeReplies = onlyMine || includeThreadReplies;
  const showThreadToggle = !onlyMine; // Hide toggle for my-posts page

  // Memoize the submissions manager call
  const {
    submissions,
    pagination,
    filters,
    isLoading,
    error,
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
    userId: session?.user?.id?.toString() || '',
    includeThreadReplies: shouldIncludeReplies,
    infiniteScroll: infiniteScrollMode
  });

  // Use scroll restoration hook
  useScrollRestoration({
    isLoading,
    submissions,
    pagination,
    filters,
    infiniteScrollMode
  });

  // Use event handlers hook
  const {
    handleAddFilter,
    handleAddFilters,
    handleTagClick,
    handleHashtagClick,
    handleMentionClick,
    handleToggleThreadReplies,
    handleNewPostClick,
    handleRefresh,
    handleFilterSuccess,
    handleUpdateFilter
  } = usePostsManagerHandlers({
    addFilter,
    addFilters,
    setIncludeThreadReplies,
    onNewPostClick
  });

  // Memoize authorization check
  const isAuthorized = useMemo(() => !!session?.user?.id, [session?.user?.id]);

  // Memoize total pages calculation
  const totalPages = useMemo(
    () => Math.ceil(pagination.totalRecords / pagination.pageSize),
    [pagination.totalRecords, pagination.pageSize]
  );

  // Scroll restoration effect
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Restore scroll position when data loads
    if (submissions.length > 0 && !isLoading && !infiniteScrollMode) {
      // Fix the generateScrollKey call to use correct arguments
      const scrollKey = generateScrollKey(pathname, {
        page: pagination.currentPage,
        filters: filters.reduce(
          (acc, filter) => {
            acc[filter.name] = filter.value;
            return acc;
          },
          {} as Record<string, any>
        ),
        searchParams: new URLSearchParams(window.location.search)
      });

      logger.group('scrollRestoration');
      logger.debug('Attempting scroll restoration', {
        scrollKey,
        submissionsLength: submissions.length,
        isLoading,
        infiniteScrollMode,
        pathname,
        currentPage: pagination.currentPage
      });

      const attemptScrollRestore = (attempts = 0, maxAttempts = 15) => {
        try {
          const storedPosition = localStorage.getItem(scrollKey);
          logger.debug('Stored scroll position', {
            storedPosition,
            attempts,
            maxAttempts
          });

          if (storedPosition) {
            const position = parseInt(storedPosition, 10);
            if (!isNaN(position) && position > 0) {
              // Check if we can scroll to this position
              const maxScroll = Math.max(
                0,
                document.documentElement.scrollHeight - window.innerHeight
              );

              if (position <= maxScroll + 100) {
                // Allow some tolerance
                window.scrollTo({
                  top: position,
                  behavior: 'auto' // Instant scroll for restoration
                });

                logger.debug('Scroll restored successfully', {
                  position,
                  maxScroll,
                  attempts
                });

                // Clear the stored position after successful restoration
                try {
                  localStorage.removeItem(scrollKey);
                } catch (error) {
                  logger.warn('Failed to clear stored scroll position', {
                    scrollKey,
                    error:
                      error instanceof Error ? error.message : String(error)
                  });
                }

                return; // Success, exit
              }
            }
          }

          // If we can't restore yet and haven't exceeded max attempts
          if (attempts < maxAttempts) {
            logger.debug('Retrying scroll restoration', {
              attempts: attempts + 1,
              maxAttempts
            });
            setTimeout(() => attemptScrollRestore(attempts + 1), 100);
          } else {
            logger.warn('Max scroll restoration attempts reached', {
              attempts,
              maxAttempts,
              scrollKey
            });
          }
        } catch (error) {
          logger.warn('Failed to restore scroll position', {
            scrollKey,
            attempts,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      };

      // Start restoration attempt
      attemptScrollRestore();
      logger.groupEnd();
    } else {
      logger.group('scrollRestoration');
      logger.debug('Skipping scroll restoration', {
        submissionsLength: submissions.length,
        isLoading,
        infiniteScrollMode
      });
      logger.groupEnd();
    }
  }, [
    submissions,
    isLoading,
    infiniteScrollMode,
    pathname,
    filters,
    pagination
  ]);

  // Cleanup scroll positions on unmount
  useEffect(() => {
    return () => {
      try {
        // Clean up any stored scroll positions when component unmounts
        const keys = Object.keys(localStorage);
        const scrollKeys = keys.filter((key) => key.startsWith('scroll-'));
        scrollKeys.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            logger.debug('Failed to remove scroll key', {
              key,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        });
      } catch (error) {
        logger.warn('Failed to clear stored scroll positions', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
  }, []);

  // Debug logging for render state
  logger.group('renderState');
  logger.debug('Rendering with state', {
    isLoading,
    hasSubmissions: submissions.length > 0,
    error,
    filtersCount: filters.length,
    currentPage: pagination.currentPage,
    totalPages: Math.ceil(pagination.totalRecords / pagination.pageSize),
    infiniteScrollMode,
    showFilters
  });
  logger.groupEnd();

  return (
    <>
      <div className="posts-manager__controls">
        {/* Top controls row with spacing toggle, pagination toggle, results count, and new post button */}
        <div
          className={`posts-manager__top-controls ${isMobile ? 'posts-manager__top-controls--minimal' : ''}`}
        >
          <div className="posts-manager__display-controls">
            {!isMobile && <SpacingThemeToggle />}

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
              {!isMobile && 'Filters'}
              {filters.length > 0 && (
                <span className="posts-manager__filter-count">
                  {filters.length}
                </span>
              )}
              {!isMobile && (
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
              )}
            </button>

            {/* Pagination Mode Toggle */}
            <div className="posts-manager__pagination-toggle">
              {!isMobile && (
                <label className="posts-manager__pagination-label">
                  Pages:
                </label>
              )}
              <div className="posts-manager__pagination-options">
                <button
                  className={`posts-manager__pagination-button ${
                    !infiniteScrollMode ? 'active' : ''
                  }`}
                  onClick={() => setInfiniteScrollMode(false)}
                  aria-pressed={!infiniteScrollMode}
                  title="Traditional pagination"
                >
                  {isMobile ? 'T' : 'Traditional'}
                </button>
                <button
                  className={`posts-manager__pagination-button ${
                    infiniteScrollMode ? 'active' : ''
                  }`}
                  onClick={() => setInfiniteScrollMode(true)}
                  aria-pressed={infiniteScrollMode}
                  title="Infinite scroll"
                >
                  {isMobile ? '∞' : 'Infinite'}
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
                  : isMobile
                    ? `${pagination.totalRecords.toLocaleString()}`
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
              {!isMobile && 'New Post'}
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

      {/* Sticky Controls - appears when main controls are out of view */}
      <StickyPostsControls
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtersCount={filters.length}
        infiniteScrollMode={infiniteScrollMode}
        onTogglePaginationMode={setInfiniteScrollMode}
        totalRecords={pagination.totalRecords}
        isLoading={isLoading}
        hasFilters={filters.length > 0}
        onNewPostClick={onNewPostClick ? handleNewPostClick : undefined}
      />

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
        currentPage={pagination.currentPage}
        currentFilters={filters}
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
