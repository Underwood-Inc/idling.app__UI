'use client';

import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import { FilterLabel } from './FilterLabel';
import { getTagsFromSearchParams } from './utils/get-tags';

function dedupeStringArray(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

interface FilterBarProps {
  filterId: string;
  filters: Filter<PostFilters>[];
  onRemoveFilter: (filterName: PostFilters) => void;
  onRemoveTag: (tagToRemove: string) => void;
  onClearFilters: () => void;
}

export default function FilterBar({
  filterId,
  filters,
  onRemoveFilter,
  onRemoveTag,
  onClearFilters
}: FilterBarProps) {
  // Add null check for filters
  const safeFilters = filters || [];

  // eslint-disable-next-line no-console
  console.log('🔍 [FILTER_BAR] Rendering with filters:', {
    filtersCount: safeFilters.length,
    filters: safeFilters.map((f) => ({ name: f.name, value: f.value }))
  });

  if (safeFilters.length === 0) {
    return null;
  }

  const handleRemoveFilter = (filterName: PostFilters) => {
    // eslint-disable-next-line no-console
    console.log('🗑️ [FILTER_BAR] Removing filter:', filterName);
    onRemoveFilter(filterName);
  };

  const handleClearFilters = () => {
    // eslint-disable-next-line no-console
    console.log('🧹 [FILTER_BAR] Clearing all filters');
    onClearFilters();
  };

  return (
    <article className="filter-bar__container">
      {safeFilters.map((filter) => {
        if (!filter.value) {
          return null;
        }

        // Deduplicate tags before rendering with proper validation
        const values = dedupeStringArray(getTagsFromSearchParams(filter.value));

        if (values.length === 0) {
          return null;
        }

        const renderValues = () =>
          values.map((value) => (
            <div key={value} className="filter-bar__filter-value-container">
              <FilterLabel
                name={filter.name}
                label={value}
                filterId={filterId}
                onRemoveTag={onRemoveTag}
              />
            </div>
          ));

        return (
          <div key={filter.name} className="filter-bar__filter">
            <div className="filter-bar__filter-name-container">
              <button
                className="filter-bar__clear"
                onClick={() => handleRemoveFilter(filter.name)}
              >
                Clear
              </button>
              &nbsp;
              <p className="uppercase filter-bar__filter-name">
                {filter.name}:
              </p>
              &nbsp;
              {renderValues()}
            </div>
          </div>
        );
      })}
      <button
        className="filter-bar__clear-all-button"
        onClick={handleClearFilters}
        aria-label="Clear all filters"
      >
        Clear all
      </button>
    </article>
  );
}
