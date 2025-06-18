'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { SubmissionItem } from './SubmissionItem';
import './SubmissionItem.css';
import './SubmissionsList.css';

export interface SubmissionsListProps {
  posts: any[];
  onTagClick: (tag: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string, filterType: 'author' | 'mentions') => void;
  showSkeletons?: boolean;
  onRefresh?: () => void;
  contextId: string;
}

// Virtual scrolling configuration
const BATCH_SIZE = 10; // Max 10 posts rendered at a time as requested
const ESTIMATED_ITEM_HEIGHT = 150; // Estimated height per post item (reduced from 200)
const BUFFER_SIZE = 2; // Number of batches to keep rendered before/after visible area

const SubmissionsList = React.memo(function SubmissionsList({
  posts,
  onTagClick,
  onHashtagClick,
  onMentionClick,
  showSkeletons,
  onRefresh,
  contextId
}: SubmissionsListProps) {
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: BATCH_SIZE
  });
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Calculate visible posts based on scroll position
  const calculateVisibleRange = useCallback(
    (scrollTop: number, containerHeight: number) => {
      const startIndex = Math.max(
        0,
        Math.floor(scrollTop / ESTIMATED_ITEM_HEIGHT) - BUFFER_SIZE * BATCH_SIZE
      );
      const endIndex = Math.min(
        posts.length,
        Math.ceil((scrollTop + containerHeight) / ESTIMATED_ITEM_HEIGHT) +
          BUFFER_SIZE * BATCH_SIZE
      );

      // Ensure we render in batches of BATCH_SIZE
      const startBatch = Math.floor(startIndex / BATCH_SIZE);
      const endBatch = Math.ceil(endIndex / BATCH_SIZE);

      return {
        start: startBatch * BATCH_SIZE,
        end: Math.min(posts.length, endBatch * BATCH_SIZE)
      };
    },
    [posts.length]
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

        if (
          newRange.start !== visibleRange.start ||
          newRange.end !== visibleRange.end
        ) {
          setVisibleRange(newRange);
        }

        isScrolling.current = false;
      }, 100);
    },
    [calculateVisibleRange, visibleRange.start, visibleRange.end]
  );

  // Initialize visible range when posts change
  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const newRange = calculateVisibleRange(scrollTop, containerHeight);
      setVisibleRange(newRange);
    }
  }, [posts.length, calculateVisibleRange, scrollTop]);

  // Get visible posts to render
  const visiblePosts = useMemo(() => {
    return posts.slice(visibleRange.start, visibleRange.end);
  }, [posts, visibleRange.start, visibleRange.end]);

  // Calculate spacing for virtual scrolling
  const topSpacer = visibleRange.start * ESTIMATED_ITEM_HEIGHT;
  const bottomSpacer =
    (posts.length - visibleRange.end) * ESTIMATED_ITEM_HEIGHT;

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
              className="submissions-list__item"
              style={
                {
                  '--item-index': actualIndex
                } as React.CSSProperties & { '--item-index': number }
              }
            >
              <SubmissionItem
                submission={post}
                onTagClick={onTagClick}
                onHashtagClick={onHashtagClick}
                onMentionClick={onMentionClick}
                onSubmissionUpdate={onRefresh}
                contextId={contextId}
              />
            </div>
          );
        })}
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
      {process.env.NODE_ENV === 'development' && (
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
        </div>
      )}
    </div>
  );
});

export default SubmissionsList;
