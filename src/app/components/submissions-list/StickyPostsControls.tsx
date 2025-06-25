'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { InstantLink } from '../ui/InstantLink';
import './StickyPostsControls.css';

interface StickyPostsControlsProps {
  // Filter state
  showFilters: boolean;
  onToggleFilters: () => void;
  filtersCount: number;

  // Pagination state
  infiniteScrollMode: boolean;
  onTogglePaginationMode: (mode: boolean) => void;

  // Results info
  totalRecords: number;
  isLoading: boolean;
  hasFilters: boolean;

  // New post functionality
  onNewPostClick?: () => void;

  // Container monitoring
  containerSelector?: string;
}

export function StickyPostsControls({
  showFilters,
  onToggleFilters,
  filtersCount,
  infiniteScrollMode,
  onTogglePaginationMode,
  totalRecords,
  isLoading,
  hasFilters,
  onNewPostClick,
  containerSelector = '.posts-manager__top-controls'
}: StickyPostsControlsProps) {
  const { data: session } = useSession();
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [isVisible, setIsVisible] = useState(false);

  const isAuthorized = Boolean(session?.user?.id);

  const updatePosition = useCallback(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Show sticky controls when original controls are not visible in viewport
    const isContainerOffScreen =
      containerRect.bottom < 0 || containerRect.top > viewportHeight;

    setIsVisible(isContainerOffScreen);

    // Always position at top when controls are out of view
    setPosition('top');
  }, [containerSelector]);

  useEffect(() => {
    // Initial check
    updatePosition();

    // Add scroll listener
    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updatePosition]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`sticky-posts-controls sticky-posts-controls--${position}`}
      data-position={position}
    >
      <div className="sticky-posts-controls__content">
        {/* Essential controls only - minimal design */}

        {/* Filter toggle with count */}
        <button
          className={`sticky-posts-controls__filter-toggle ${
            showFilters ? 'sticky-posts-controls__filter-toggle--active' : ''
          } ${
            filtersCount > 0
              ? 'sticky-posts-controls__filter-toggle--has-filters'
              : ''
          }`}
          onClick={onToggleFilters}
          aria-expanded={showFilters}
          title={showFilters ? 'Hide filters' : 'Show filters'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
          </svg>
          {filtersCount > 0 && (
            <span className="sticky-posts-controls__filter-count">
              {filtersCount}
            </span>
          )}
        </button>

        {/* Results count - compact version */}
        {!isLoading && (
          <div className="sticky-posts-controls__results">
            <span className="sticky-posts-controls__results-text">
              {totalRecords === 0
                ? 'No results'
                : `${totalRecords.toLocaleString()}`}
              {hasFilters && (
                <span className="sticky-posts-controls__filtered">
                  {' '}
                  (filtered)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Pagination mode toggle - minimal */}
        <div className="sticky-posts-controls__pagination">
          <button
            className={`sticky-posts-controls__pagination-button ${
              !infiniteScrollMode ? 'active' : ''
            }`}
            onClick={() => onTogglePaginationMode(false)}
            aria-pressed={!infiniteScrollMode}
            title="Traditional pagination"
          >
            T
          </button>
          <button
            className={`sticky-posts-controls__pagination-button ${
              infiniteScrollMode ? 'active' : ''
            }`}
            onClick={() => onTogglePaginationMode(true)}
            aria-pressed={infiniteScrollMode}
            title="Infinite scroll"
          >
            ∞
          </button>
        </div>

        {/* New post button - icon only */}
        {onNewPostClick && (
          <InstantLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNewPostClick();
            }}
            className="sticky-posts-controls__new-post instant-link--button"
            aria-disabled={!isAuthorized}
            title={isAuthorized ? 'Create a new post' : 'Login to create posts'}
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
          </InstantLink>
        )}
      </div>
    </div>
  );
}
