'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import InfiniteScrollTrigger from '../infinite-scroll-trigger/InfiniteScrollTrigger';
import { SubmissionItem } from './SubmissionItem';
import './SubmissionItem.css';
import './SubmissionsList.css';

// Virtual scrolling constants
const BATCH_SIZE = 20; // Number of items to render in each batch
const BUFFER_SIZE = 1; // Number of batches to render outside visible area
const ESTIMATED_ITEM_HEIGHT = 150; // Fallback height estimate
const HEIGHT_CACHE_SIZE = 100; // Maximum items to cache heights for

export interface SubmissionsListProps {
  posts: any[];
  onTagClick: (tag: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  showSkeletons?: boolean;
  onRefresh?: () => void;
  contextId: string;
  // Infinite scroll props
  infiniteScrollMode?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  // Optimistic update functions
  optimisticUpdateSubmission?: (
    submissionId: number,
    updatedSubmission: any
  ) => void;
  optimisticRemoveSubmission?: (submissionId: number) => void;
  // Scroll position context
  currentPage?: number;
  currentFilters?: Record<string, any>;
  // Custom renderer
  children?: (props: {
    submission: any;
    onTagClick: (tag: string) => void;
    onHashtagClick?: (hashtag: string) => void;
    onMentionClick?: (
      mention: string,
      filterType: 'author' | 'mentions'
    ) => void;
    onSubmissionUpdate?: () => void;
    contextId: string;
    // Add optimistic update functions to custom renderer
    optimisticUpdateSubmission?: (
      submissionId: number,
      updatedSubmission: any
    ) => void;
    optimisticRemoveSubmission?: (submissionId: number) => void;
    // Scroll position context
    currentPage?: number;
    currentFilters?: Record<string, any>;
  }) => React.ReactNode;
}

const SubmissionsList = React.memo(function SubmissionsList({
  posts,
  onTagClick,
  onHashtagClick,
  onMentionClick,
  showSkeletons,
  onRefresh,
  contextId,
  infiniteScrollMode = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  optimisticUpdateSubmission,
  optimisticRemoveSubmission,
  currentPage,
  currentFilters,
  children
}: SubmissionsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const heightCache = useRef<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: BATCH_SIZE
  });
  const visibleRangeRef = useRef(visibleRange);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Update ref when visible range changes
  useEffect(() => {
    visibleRangeRef.current = visibleRange;
  }, [visibleRange]);

  // Get cached height or estimate
  const getItemHeight = useCallback((index: number): number => {
    const cached = heightCache.current.get(index);
    if (cached) return cached;

    // Use average of cached heights if available, otherwise use estimate
    const cachedHeights = Array.from(heightCache.current.values());
    if (cachedHeights.length > 0) {
      const average =
        cachedHeights.reduce((sum, h) => sum + h, 0) / cachedHeights.length;
      return Math.round(average);
    }

    return ESTIMATED_ITEM_HEIGHT;
  }, []);

  // Calculate cumulative heights for positioning
  const getCumulativeHeight = useCallback(
    (index: number): number => {
      let height = 0;
      for (let i = 0; i < index; i++) {
        height += getItemHeight(i);
      }
      return height;
    },
    [getItemHeight]
  );

  // Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback(
    (scrollTop: number, containerHeight: number) => {
      if (posts.length === 0) return { start: 0, end: 0 };

      // Find start index using binary search for efficiency
      let startIndex = 0;
      let endIndex = posts.length - 1;

      while (startIndex < endIndex) {
        const mid = Math.floor((startIndex + endIndex) / 2);
        const midTop = getCumulativeHeight(mid);

        if (midTop < scrollTop) {
          startIndex = mid + 1;
        } else {
          endIndex = mid;
        }
      }

      // Find end index
      let currentHeight = getCumulativeHeight(startIndex);
      let visibleEndIndex = startIndex;

      while (
        visibleEndIndex < posts.length &&
        currentHeight < scrollTop + containerHeight
      ) {
        currentHeight += getItemHeight(visibleEndIndex);
        visibleEndIndex++;
      }

      // Add buffer
      const bufferStart = Math.max(0, startIndex - BUFFER_SIZE * BATCH_SIZE);
      const bufferEnd = Math.min(
        posts.length,
        visibleEndIndex + BUFFER_SIZE * BATCH_SIZE
      );

      // Ensure we render in batches
      const startBatch = Math.floor(bufferStart / BATCH_SIZE);
      const endBatch = Math.ceil(bufferEnd / BATCH_SIZE);

      return {
        start: startBatch * BATCH_SIZE,
        end: Math.min(posts.length, endBatch * BATCH_SIZE)
      };
    },
    [posts.length, getCumulativeHeight, getItemHeight]
  );

  // Handle scroll events with throttling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const containerHeight = e.currentTarget.clientHeight;

      setScrollTop(scrollTop);

      if (!isScrolling.current) {
        isScrolling.current = true;
      }

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Throttle scroll updates
      scrollTimeout.current = setTimeout(() => {
        const newRange = calculateVisibleRange(scrollTop, containerHeight);
        const currentRange = visibleRangeRef.current;

        if (
          newRange.start !== currentRange.start ||
          newRange.end !== currentRange.end
        ) {
          setVisibleRange(newRange);
        }

        isScrolling.current = false;
      }, 100);
    },
    [calculateVisibleRange]
  );

  // Set up ResizeObserver to track actual item heights
  useEffect(() => {
    if (!window.ResizeObserver) return;

    resizeObserver.current = new ResizeObserver((entries) => {
      let heightsChanged = false;

      entries.forEach((entry) => {
        const element = entry.target as HTMLDivElement;
        const index = parseInt(element.dataset.itemIndex || '-1');

        if (index >= 0) {
          const newHeight = Math.round(entry.contentRect.height);
          const oldHeight = heightCache.current.get(index);

          if (oldHeight !== newHeight) {
            heightCache.current.set(index, newHeight);
            heightsChanged = true;

            // Limit cache size
            if (heightCache.current.size > HEIGHT_CACHE_SIZE) {
              const oldestKey = heightCache.current.keys().next().value;
              if (oldestKey !== undefined) {
                heightCache.current.delete(oldestKey);
              }
            }
          }
        }
      });

      // Recalculate visible range if heights changed
      if (heightsChanged && containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const newRange = calculateVisibleRange(scrollTop, containerHeight);
        setVisibleRange(newRange);
      }
    });

    // Observe all currently rendered items
    itemRefs.current.forEach((element) => {
      resizeObserver.current?.observe(element);
    });

    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [calculateVisibleRange, scrollTop]);

  // Initialize visible range when posts change
  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const newRange = calculateVisibleRange(scrollTop, containerHeight);
      setVisibleRange(newRange);
    }
  }, [posts.length, calculateVisibleRange]);

  // Get visible posts to render
  const visiblePosts = useMemo(() => {
    return posts.slice(visibleRange.start, visibleRange.end);
  }, [posts, visibleRange.start, visibleRange.end]);

  // Calculate spacing for virtual scrolling
  const topSpacer = getCumulativeHeight(visibleRange.start);
  const bottomSpacer =
    getCumulativeHeight(posts.length) - getCumulativeHeight(visibleRange.end);

  // Track item refs for ResizeObserver
  const setItemRef = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(index, element);
        element.dataset.itemIndex = index.toString();
        resizeObserver.current?.observe(element);
      } else {
        const oldElement = itemRefs.current.get(index);
        if (oldElement) {
          resizeObserver.current?.unobserve(oldElement);
          itemRefs.current.delete(index);
        }
      }
    },
    []
  );

  // Skeleton loading
  if (showSkeletons) {
    return (
      <div className="submissions-list" data-testid="submissions-list">
        {Array.from({ length: Math.min(BATCH_SIZE, 5) }, (_, index) => (
          <div
            key={index}
            className="submissions-list__skeleton"
            data-testid="submissions-list__skeleton"
          >
            <div className="submission__wrapper">
              <div className="submission__meta">
                <div className="skeleton-line skeleton-line--short"></div>
                <div className="skeleton-line skeleton-line--xs"></div>
              </div>
              <div className="submission__content">
                <div className="skeleton-line skeleton-line--title"></div>
                <div className="skeleton-line skeleton-line--description"></div>
              </div>
              <div className="submission__tags">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div
        className="submissions-list submissions-list--empty"
        data-testid="submissions-list"
      >
        <div className="submissions-list__empty-message">
          No posts to display
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="submissions-list submissions-list--virtual"
      data-testid="submissions-list"
      onScroll={handleScroll}
      style={{
        height: '70vh', // Fixed height for virtual scrolling
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* Top spacer for virtual scrolling */}
      {topSpacer > 0 && (
        <div
          className="submissions-list__spacer"
          style={{ height: topSpacer }}
          aria-hidden="true"
        />
      )}

      {/* Render visible posts */}
      <div className="submissions-list__content">
        {visiblePosts.map((post, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <div
              key={post.submission_id}
              ref={(el) => setItemRef(actualIndex, el)}
              className="submissions-list__item"
              style={
                {
                  '--item-index': actualIndex
                } as React.CSSProperties & { '--item-index': number }
              }
            >
              {children ? (
                children({
                  submission: post,
                  onTagClick,
                  onHashtagClick,
                  onMentionClick,
                  onSubmissionUpdate: onRefresh,
                  contextId,
                  optimisticUpdateSubmission,
                  optimisticRemoveSubmission,
                  currentPage,
                  currentFilters
                })
              ) : (
                <SubmissionItem
                  submission={post}
                  onTagClick={onTagClick}
                  onHashtagClick={onHashtagClick}
                  onMentionClick={onMentionClick}
                  onSubmissionUpdate={onRefresh}
                  contextId={contextId}
                  optimisticUpdateSubmission={optimisticUpdateSubmission}
                  optimisticRemoveSubmission={optimisticRemoveSubmission}
                  currentPage={currentPage}
                  currentFilters={currentFilters}
                />
              )}
            </div>
          );
        })}

        {/* Infinite scroll trigger - only show when in infinite mode and at the end */}
        {infiniteScrollMode &&
          hasMore &&
          onLoadMore &&
          visibleRange.end >= posts.length && (
            <div className="submissions-list__infinite-trigger">
              <InfiniteScrollTrigger
                onLoadMore={onLoadMore}
                isLoading={isLoadingMore}
                className="submissions-list__trigger"
              />
            </div>
          )}
      </div>

      {/* Bottom spacer for virtual scrolling */}
      {bottomSpacer > 0 && (
        <div
          className="submissions-list__spacer"
          style={{ height: bottomSpacer }}
          aria-hidden="true"
        />
      )}

      {/* Debugging info in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div
          className="submissions-list__debug"
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            fontFamily: 'monospace'
          }}
        >
          <div>Total: {posts.length}</div>
          <div>
            Visible: {visibleRange.start}-{visibleRange.end}
          </div>
          <div>Rendered: {visiblePosts.length}</div>
          <div>Scroll: {Math.round(scrollTop)}px</div>
          <div>Heights Cached: {heightCache.current.size}</div>
        </div>
      )} */}
    </div>
  );
});

export default SubmissionsList;
