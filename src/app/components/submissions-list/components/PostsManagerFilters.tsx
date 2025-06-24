'use client';

import React from 'react';
import { CustomFilterInput } from '../../filter-bar/CustomFilterInput';
import FilterBar from '../../filter-bar/FilterBar';

export interface PostsManagerFiltersProps {
  showFilters: boolean;
  contextId: string;
  filters: Array<{ name: string; value: any }>;
  onRemoveFilter: (name: string, value?: any) => void;
  onRemoveTag: (tag: string) => void;
  onClearFilters: () => void;
  onUpdateFilter: (name: string, value: string) => void;
  onAddFilter: (filter: any) => void;
  onAddFilters: (filters: any[]) => void;
  onFilterSuccess: () => void;
  showThreadToggle: boolean;
  includeThreadReplies: boolean;
  onToggleThreadReplies: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PostsManagerFilters({
  showFilters,
  contextId,
  filters,
  onRemoveFilter,
  onRemoveTag,
  onClearFilters,
  onUpdateFilter,
  onAddFilter,
  onAddFilters,
  onFilterSuccess,
  showThreadToggle,
  includeThreadReplies,
  onToggleThreadReplies
}: PostsManagerFiltersProps) {
  return (
    <div
      className={`posts-manager__filter-section ${showFilters ? 'posts-manager__filter-section--expanded' : 'posts-manager__filter-section--collapsed'}`}
      aria-hidden={!showFilters}
    >
      <div className="posts-manager__filter-content">
        <FilterBar
          filterId={contextId}
          filters={filters as any}
          onRemoveFilter={onRemoveFilter}
          onRemoveTag={onRemoveTag}
          onClearFilters={onClearFilters}
          onUpdateFilter={onUpdateFilter}
        />

        {/* Custom Filter Input */}
        <CustomFilterInput
          contextId={contextId}
          onAddFilter={onAddFilter}
          onAddFilters={onAddFilters}
          onFilterSuccess={onFilterSuccess}
          className="posts-manager__custom-filter"
        />

        {/* Thread Reply Toggle - Compact */}
        {showThreadToggle && (
          <div className="posts-manager__thread-controls">
            <label className="posts-manager__toggle posts-manager__toggle--compact">
              <input
                type="checkbox"
                checked={includeThreadReplies}
                onChange={onToggleThreadReplies}
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
  );
}
