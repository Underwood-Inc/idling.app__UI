'use client';

import { createLogger } from '@lib/logging';
import { useSubmissionsManager } from '@lib/state/useSubmissionsManager';
import '@lib/utils/scroll-highlight-demo'; // Import for global test function
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Submission } from '../submission-forms/schema';
import { SubmissionWithReplies } from './types';

import { Filter } from '@lib/state/atoms';
import { PostFilters } from '@lib/types/filters';
import { usePaginationPreRequest } from '../../hooks/usePaginationPreRequest';
import { SimpleSkeletonWrapper } from '../skeleton/SimpleSkeletonWrapper';
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
    component: 'PostsManager',
    module: 'components/submissions-list'
  },
  enabled: false // Disabled to reduce log noise
});

interface PostsManagerProps {
  contextId: string;
  onlyMine?: boolean;
  enableThreadMode?: boolean;
  onNewPostClick?: () => void;
  initialFilters?: Array<{ name: string; value: string }>;
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
function PostsManager({
  contextId,
  onlyMine = false,
  enableThreadMode = false,
  onNewPostClick,
  initialFilters = [],
  renderSubmissionItem
}: PostsManagerProps) {
  const { data: session } = useSession();

  // Debug logging removed to prevent unnecessary render cycles

  // Track filter operations for debugging
  const filterOpCount = useRef(0);
  const lastFilterOp = useRef('');

  // Use custom hooks for state management
  const {
    spacingTheme,
    includeThreadReplies,
    setIncludeThreadReplies,
    isMobile,
    infiniteScrollMode,
    setInfiniteScrollMode,
    showFilters,
    setShowFilters
  } = usePostsManagerState();

  // Default behavior: show posts only (no replies) for both pages
  // Replies are only included when:
  // 1. includeThreadReplies toggle is enabled, OR
  // 2. onlyReplies filter is active
  const shouldIncludeReplies = includeThreadReplies;
  const showRepliesFilter = true; // Always show the combined filter

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
    optimisticRemoveSubmission,
    updateFilter
  } = useSubmissionsManager({
    contextId,
    onlyMine,
    initialFilters: initialFilters as any,
    initialUserId: session?.user?.id?.toString() || '',
    includeThreadReplies: shouldIncludeReplies,
    infiniteScroll: infiniteScrollMode
  });

  // Check if onlyReplies filter is active
  const onlyRepliesFilter = filters.find(
    (filter) => filter.name === 'onlyReplies'
  );
  const onlyReplies = onlyRepliesFilter?.value === 'true';

  // Pagination pre-request for intelligent skeleton loading
  const {
    data: preRequestData,
    isLoading: isPreRequestLoading,
    error: preRequestError
  } = usePaginationPreRequest({
    onlyMine,
    userId: session?.user?.id?.toString() || '',
    filters: filters as Filter<PostFilters>[],
    pageSize: pagination.pageSize,
    includeThreadReplies: shouldIncludeReplies,
    enabled: true // Always enabled for skeleton optimization
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
    handleUpdateFilter,
    handleTextSearch
  } = usePostsManagerHandlers({
    addFilter,
    addFilters,
    removeFilter,
    updateFilter,
    setIncludeThreadReplies,
    onNewPostClick,
    contextId
  });

  // Handler for only replies toggle
  const handleOnlyRepliesToggle = useCallback(
    (checked: boolean) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 PostsManager: onlyReplies toggle', {
          checked,
          currentOnlyReplies: onlyReplies
        });
      }
      if (checked) {
        addFilter({ name: 'onlyReplies', value: 'true' });
      } else {
        removeFilter('onlyReplies');
      }
    },
    [addFilter, removeFilter]
  );

  // Wrapper function for thread toggle that accepts boolean
  const handleThreadToggle = useCallback(
    (checked: boolean) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔍 PostsManager: includeThreadReplies toggle', {
          checked,
          currentIncludeThreadReplies: includeThreadReplies
        });
      }
      setIncludeThreadReplies(checked);
    },
    [setIncludeThreadReplies]
  );

  // Initial filters are now handled by useUrlSync in useSubmissionsManager
  // No need to apply them here to avoid duplicates

  // Memoize authorization check
  const isAuthorized = useMemo(() => !!session?.user?.id, [session?.user?.id]);

  // Handle filter type change events from FilterBar
  useEffect(() => {
    const handleAddFilterFromToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { filterType, value } = customEvent.detail;

      // Add the new filter
      addFilter({ name: filterType, value });
    };

    window.addEventListener('addFilterFromToggle', handleAddFilterFromToggle);

    return () => {
      window.removeEventListener(
        'addFilterFromToggle',
        handleAddFilterFromToggle
      );
    };
  }, [addFilter]);

  // Memoize total pages calculation
  const totalPages = useMemo(
    () => Math.ceil(pagination.totalRecords / pagination.pageSize),
    [pagination.totalRecords, pagination.pageSize]
  );

  // Calculate expected skeleton items based on pre-request data
  const expectedSkeletonItems = useMemo(() => {
    if (preRequestData?.expectedItems) {
      return preRequestData.expectedItems;
    }
    // Fallback to pagination page size or default
    return Math.min(pagination.pageSize || 10, 10);
  }, [preRequestData?.expectedItems, pagination.pageSize]);

  // Calculate actual filter count (excluding logic-only filters)
  const actualFiltersCount = useMemo(() => {
    return filters.filter(
      (filter) =>
        !['tagLogic', 'authorLogic', 'mentionsLogic', 'globalLogic'].includes(
          filter.name
        )
    ).length;
  }, [filters]);

  // Debug logging for filter operations
  if (process.env.NODE_ENV === 'development') {
    const currentFilterString = JSON.stringify(filters);
    if (
      filterOpCount.current === 0 ||
      lastFilterOp.current !== currentFilterString
    ) {
      filterOpCount.current += 1;
      lastFilterOp.current = currentFilterString;
      // eslint-disable-next-line no-console
      console.log(`Filter operation #${filterOpCount.current}:`, {
        filtersCount: filters.length,
        isLoading
      });
    }
  }

  // Debug logging for render state
  logger.group('renderState');
  logger.debug('Rendering with state', {
    isLoading,
    hasSubmissions: submissions.length > 0,
    submissionsCount: submissions.length,
    error,
    filtersCount: actualFiltersCount,
    currentPage: pagination.currentPage,
    totalPages: Math.ceil(pagination.totalRecords / pagination.pageSize),
    totalRecords: pagination.totalRecords,
    infiniteScrollMode,
    showFilters,
    expectedSkeletonItems,
    preRequestData: preRequestData
      ? {
          expectedItems: preRequestData.expectedItems,
          isLoading: isPreRequestLoading
        }
      : null
  });

  // Additional debug logging for search results issue
  if (process.env.NODE_ENV === 'development' && filterOpCount.current <= 3) {
    // Only log first few filter operations to avoid spam
    // eslint-disable-next-line no-console
    console.log('🔍 PostsManager Debug - Search Results Issue:', {
      submissionsLength: submissions.length,
      isLoading,
      error,
      totalRecords: pagination.totalRecords,
      filters: filters.map((f) => ({ name: f.name, value: f.value })),
      firstSubmission: submissions[0]
        ? {
            id: submissions[0].submission_id,
            title: submissions[0].submission_title,
            author: submissions[0].author
          }
        : null
    });
  }

  logger.groupEnd();

  // Memoize filter toggle function
  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters, setShowFilters]);

  // Memoize remove filter function
  const handleRemoveFilter = useCallback(
    (name: string, value?: any) => removeFilter(name as any, value),
    [removeFilter]
  );

  return (
    <>
      <div className="posts-manager__controls">
        {/* Top controls row with filters and new post button */}
        <PostsManagerControls
          isMobile={isMobile}
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
          filtersCount={actualFiltersCount}
          totalRecords={pagination.totalRecords}
          isLoading={isLoading}
          error={error as any}
          onNewPostClick={handleNewPostClick}
          isAuthorized={isAuthorized}
          compactMode={spacingTheme === 'compact'}
        />

        {/* Collapsible Filter Section */}
        <PostsManagerFilters
          showFilters={showFilters}
          contextId={contextId}
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onRemoveTag={removeTag}
          onClearFilters={clearFilters}
          onUpdateFilter={handleUpdateFilter}
          onAddFilter={addFilter}
          onAddFilters={addFilters}
          onFilterSuccess={handleFilterSuccess}
          onTextSearch={handleTextSearch}
          showRepliesFilter={showRepliesFilter}
          includeThreadReplies={includeThreadReplies}
          onlyReplies={onlyReplies}
          onToggleThreadReplies={handleThreadToggle}
          onToggleOnlyReplies={handleOnlyRepliesToggle}
          isLoading={isLoading}
        />

        {/* Sticky Controls - appears when main controls are out of view */}
        <StickyPostsControls
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
          filtersCount={actualFiltersCount}
          infiniteScrollMode={infiniteScrollMode}
          onTogglePaginationMode={setInfiniteScrollMode}
          totalRecords={pagination.totalRecords}
          isLoading={isLoading}
          hasFilters={actualFiltersCount > 0}
          onNewPostClick={handleNewPostClick}
        />
      </div>

      {/* Simple Skeleton Wrapper for SubmissionsList */}
      <SimpleSkeletonWrapper
        isLoading={isLoading}
        className="posts-manager__submissions-wrapper"
        expectedItemCount={expectedSkeletonItems}
      >
        <SubmissionsList
          posts={submissions}
          onTagClick={handleTagClick}
          onHashtagClick={handleHashtagClick}
          onMentionClick={handleMentionClick}
          showSkeletons={false} // Handled by SimpleSkeletonWrapper
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
          error={error as any}
        >
          {renderSubmissionItem}
        </SubmissionsList>
      </SimpleSkeletonWrapper>

      {/* Pagination */}
      <PostsManagerPagination
        isLoading={isLoading}
        error={error ?? null}
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
}

export default PostsManager;
