'use client';

import { InstantLink } from '../../ui/InstantLink';

export interface PostsManagerControlsProps {
  isMobile: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
  filtersCount: number;
  totalRecords: number;
  isLoading: boolean;
  error: string | null;
  onNewPostClick?: () => void;
  isAuthorized: boolean;
  compactMode?: boolean;
}

export function PostsManagerControls({
  isMobile,
  showFilters,
  onToggleFilters,
  filtersCount,
  totalRecords,
  isLoading,
  error,
  onNewPostClick,
  isAuthorized,
  compactMode = false
}: PostsManagerControlsProps) {
  const isCompact = compactMode || isMobile;

  return (
    <div
      className={`posts-manager__top-controls ${isMobile ? 'posts-manager__top-controls--minimal' : ''} ${compactMode ? 'posts-manager__top-controls--compact' : ''}`}
    >
      <div className="posts-manager__display-controls">
        {/* Filter Toggle Button */}
        <button
          className={`posts-manager__filter-toggle ${
            showFilters ? 'posts-manager__filter-toggle--active' : ''
          } ${
            filtersCount > 0 ? 'posts-manager__filter-toggle--has-filters' : ''
          } ${isCompact ? 'posts-manager__filter-toggle--compact' : ''}`}
          onClick={onToggleFilters}
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
          {!isCompact && 'Filters'}
          {filtersCount > 0 && (
            <span className="posts-manager__filter-count">{filtersCount}</span>
          )}

          {!isCompact && (
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
      </div>

      {/* Results count display */}
      {!isLoading && !error && (
        <div
          className={`posts-manager__results-count ${isCompact ? 'posts-manager__results-count--compact' : ''}`}
        >
          <span className="posts-manager__results-text">
            {totalRecords === 0
              ? 'No results found'
              : isCompact
                ? `Posts: ${totalRecords.toLocaleString()}`
                : `${totalRecords.toLocaleString()} result${
                    totalRecords === 1 ? '' : 's'
                  }`}
          </span>
        </div>
      )}

      {/* New Post Button */}
      {onNewPostClick && (
        <InstantLink
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNewPostClick();
          }}
          className={`posts-manager__new-post-button instant-link--button ${
            isCompact ? 'posts-manager__new-post-button--compact' : ''
          }`}
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
          <span className="instant-link__content">New</span>
        </InstantLink>
      )}
    </div>
  );
}
