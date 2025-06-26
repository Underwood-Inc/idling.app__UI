'use client';

import FilterBar from '../../filter-bar/FilterBar';
import { SmartTextSearchInput } from './SmartTextSearchInput';

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
  onTextSearch: (searchText: string) => void;
  // Thread replies toggle
  showThreadToggle?: boolean;
  includeThreadReplies?: boolean;
  onToggleThreadReplies?: (checked: boolean) => void;
  isLoading?: boolean;
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
  onTextSearch,
  showThreadToggle = false,
  includeThreadReplies = false,
  onToggleThreadReplies,
  isLoading = false
}: PostsManagerFiltersProps) {
  // Get current search value from filters
  const searchFilter = filters.find((f) => f.name === 'search');
  const currentSearchValue = searchFilter?.value || '';

  return (
    <div
      className={`posts-manager__filter-section ${showFilters ? 'posts-manager__filter-section--expanded' : 'posts-manager__filter-section--collapsed'}`}
      aria-hidden={!showFilters}
    >
      <div className="posts-manager__filter-content">
        {/* Enhanced Text Search Input with Smart Filters */}
        <SmartTextSearchInput
          onSearch={onTextSearch}
          onAddFilter={onAddFilter}
          onAddFilters={onAddFilters}
          onRemoveFilter={onRemoveFilter}
          onFilterSuccess={onFilterSuccess}
          onClearFilters={onClearFilters}
          contextId={contextId}
          placeholder="Search posts content... (or use @user #tag for filters)"
          className="posts-manager__text-search"
          showThreadToggle={showThreadToggle}
          includeThreadReplies={includeThreadReplies}
          onToggleThreadReplies={onToggleThreadReplies}
          isLoading={isLoading}
        />

        <FilterBar
          filterId={contextId}
          filters={filters as any}
          onRemoveFilter={onRemoveFilter}
          onRemoveTag={onRemoveTag}
          onClearFilters={onClearFilters}
          onUpdateFilter={onUpdateFilter}
        />
      </div>
    </div>
  );
}
