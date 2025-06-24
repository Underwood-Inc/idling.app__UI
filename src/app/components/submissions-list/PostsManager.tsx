'use client';

import { createLogger } from '@/lib/logging';
import { useSession } from 'next-auth/react';
import React, { useMemo } from 'react';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';
import '../../../lib/utils/scroll-highlight-demo'; // Import for global test function
import { Submission } from '../submission-forms/schema';
import { SubmissionWithReplies } from './actions';

import { PostsManagerControls } from './components/PostsManagerControls';
import { PostsManagerFilters } from './components/PostsManagerFilters';
import { PostsManagerPagination } from './components/PostsManagerPagination';
import { usePostsManagerHandlers } from './hooks/usePostsManagerHandlers';
import { usePostsManagerState } from './hooks/usePostsManagerState';
import { useScrollRestoration } from './hooks/useScrollRestoration';
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
        <PostsManagerControls
          isMobile={isMobile}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filtersCount={filters.length}
          infiniteScrollMode={infiniteScrollMode}
          onTogglePaginationMode={setInfiniteScrollMode}
          totalRecords={pagination.totalRecords}
          isLoading={isLoading}
          error={error || null}
          onNewPostClick={onNewPostClick ? handleNewPostClick : undefined}
          isAuthorized={isAuthorized}
        />

        {/* Collapsible Filter Section */}
        <PostsManagerFilters
          showFilters={showFilters}
          contextId={contextId}
          filters={filters}
          onRemoveFilter={(name: string, value?: any) =>
            removeFilter(name as any, value)
          }
          onRemoveTag={removeTag}
          onClearFilters={clearFilters}
          onUpdateFilter={handleUpdateFilter}
          onAddFilter={addFilter}
          onAddFilters={addFilters}
          onFilterSuccess={handleFilterSuccess}
          showThreadToggle={showThreadToggle}
          includeThreadReplies={includeThreadReplies}
          onToggleThreadReplies={handleToggleThreadReplies}
        />
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
      <PostsManagerPagination
        isLoading={isLoading}
        error={error || null}
        submissions={submissions}
        infiniteScrollMode={infiniteScrollMode}
        hasMore={hasMore}
        totalRecords={pagination.totalRecords}
        pagination={pagination}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
});

export default PostsManager;
