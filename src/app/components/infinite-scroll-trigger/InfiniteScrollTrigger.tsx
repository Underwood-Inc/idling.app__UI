'use client';

import { useCallback, useEffect, useRef } from 'react';
import './InfiniteScrollTrigger.css';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  className?: string;
  threshold?: number; // How much of the trigger should be visible before loading (0-1)
  rootMargin?: string; // Margin around the root for early triggering
}

const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({
  onLoadMore,
  isLoading,
  className = '',
  threshold = 0.1, // Trigger when 10% visible
  rootMargin = '100px' // Start loading 100px before trigger is visible
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && !isLoading && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onLoadMore();
      }
    },
    [onLoadMore, isLoading]
  );

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
      observer.disconnect();
    };
  }, [handleIntersection, threshold, rootMargin]);

  // Reset trigger when loading completes
  useEffect(() => {
    if (!isLoading) {
      hasTriggeredRef.current = false;
    }
  }, [isLoading]);

  return (
    <div
      ref={triggerRef}
      className={`infinite-scroll-trigger ${className} ${
        isLoading ? 'infinite-scroll-trigger--loading' : ''
      }`}
    >
      {isLoading ? (
        <div className="infinite-scroll-trigger__loader">
          <div className="infinite-scroll-trigger__spinner">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="infinite-scroll-trigger__spinner-icon"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
          <span className="infinite-scroll-trigger__text">
            Loading more posts...
          </span>
        </div>
      ) : (
        <div className="infinite-scroll-trigger__ready">
          <div className="infinite-scroll-trigger__indicator">
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
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollTrigger;
