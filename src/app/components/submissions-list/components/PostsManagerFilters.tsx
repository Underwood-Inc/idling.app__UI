'use client';

import { CustomFilterInput } from '../../filter-bar/CustomFilterInput';
import FilterBar from '../../filter-bar/FilterBar';
import { TextSearchInput } from './TextSearchInput';

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
  onTextSearch
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
        {/* Text Search Input - Prominently placed at top */}
        <TextSearchInput
          onSearch={onTextSearch}
          placeholder="Search posts content... (e.g., 'march fire jacob')"
          initialValue={currentSearchValue}
          className="posts-manager__text-search"
        />

        <FilterBar
          filterId={contextId}
          filters={filters as any}
          onRemoveFilter={onRemoveFilter}
          onRemoveTag={onRemoveTag}
          onClearFilters={onClearFilters}
          onUpdateFilter={onUpdateFilter}
        />

        {/* Combined Filter Input and Thread Controls Row */}
        <div className="posts-manager__filter-bottom-row">
          {/* Custom Filter Input */}
          <CustomFilterInput
            contextId={contextId}
            onAddFilter={onAddFilter}
            onAddFilters={onAddFilters}
            onFilterSuccess={onFilterSuccess}
            className="posts-manager__custom-filter"
          />
        </div>
      </div>
    </div>
  );
}
