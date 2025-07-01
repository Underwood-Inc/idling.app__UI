/**
 * Header Section Component
 *
 * Handles the panel header with title, description, search functionality,
 * and action buttons. This component is focused solely on the header area.
 */

import React from 'react';
import { InteractiveTooltip } from '../../../components/tooltip/InteractiveTooltip';

interface HeaderSectionProps {
  showFilterPanel: boolean;
  activeFiltersCount: number;
  searchQuery: string;
  showSearchResults: boolean;
  isSearching: boolean;
  searchOverlayContent: React.ReactNode;
  onToggleFilterPanel: () => void;
  onExportAll: () => void;
  onSearchQueryChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSearchClear: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  showFilterPanel,
  activeFiltersCount,
  searchQuery,
  showSearchResults,
  isSearching,
  searchOverlayContent,
  onToggleFilterPanel,
  onExportAll,
  onSearchQueryChange,
  onSearchFocus,
  onSearchBlur,
  onSearchClear
}) => {
  return (
    <div className="panel-header">
      <div className="header-content">
        <h2 className="panel-title">User Management</h2>
        <p className="panel-description">
          Manage user accounts, roles, subscriptions, and permissions
        </p>
      </div>

      <div className="header-actions">
        <button
          className={`filter-toggle-btn ${showFilterPanel ? 'active' : ''}`}
          onClick={onToggleFilterPanel}
          title="Toggle column filters"
        >
          <span className="filter-icon">🔍</span>
          <span className="filter-label">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="filter-count">{activeFiltersCount}</span>
          )}
        </button>

        <button
          className="export-all-btn"
          onClick={onExportAll}
          title="Export all user data"
        >
          <span className="export-icon">📊</span>
          <span className="export-label">Export All</span>
        </button>

        {/* Smart Search Input with InteractiveTooltip */}
        <div className="search-container">
          <InteractiveTooltip
            content={searchOverlayContent}
            show={showSearchResults}
            className="search-overlay-tooltip"
            triggerOnClick={false}
          >
            <div className="search-input-wrapper">
              <div className="search-input-icon">
                {isSearching ? (
                  <div className="search-spinner"></div>
                ) : (
                  <span>🔍</span>
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search users by name, email, or ID..."
                className="search-input"
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={onSearchClear}>
                  ✕
                </button>
              )}
            </div>
          </InteractiveTooltip>
        </div>
      </div>
    </div>
  );
};
