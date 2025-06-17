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

  const handleFilterRemove = (filterName: string) => {
    if (filterName === 'author') {
      onRemoveFilter('author');
    } else if (filterName === 'mentions') {
      onRemoveFilter('mentions');
    } else if (filterName === 'tagLogic') {
      onRemoveFilter('tagLogic');
    }
  };

  const handleClearFilters = () => {
    // eslint-disable-next-line no-console
    console.log('🧹 [FILTER_BAR] Clearing all filters');
    onClearFilters();
  };

  return (
    <article className="filter-bar__container">
      {safeFilters
        .filter(
          (filter) => filter.name !== 'author' && filter.name !== 'mentions'
        ) // Exclude author and mentions from generic display
        .map((filter) => {
          if (!filter.value) {
            return null;
          }

          // Deduplicate tags before rendering with proper validation
          const values = dedupeStringArray(
            getTagsFromSearchParams(filter.value)
          );

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
                  onRemoveFilter={handleFilterRemove}
                />
              </div>
            ));

          return (
            <div key={filter.name} className="filter-bar__filter">
              <p className="uppercase filter-bar__filter-name">
                {filter.name}:
              </p>
              <div className="filter-bar__filter-values-container">
                {renderValues()}
              </div>
            </div>
          );
        })}

      {/* Author filter with username|userID format */}
      {safeFilters.find((f) => f.name === 'author') && (
        <div key="author-filter" className="filter-bar__filter">
          <p className="uppercase filter-bar__filter-name">author:</p>
          <div className="filter-bar__filter-values-container">
            <div className="filter-bar__filter-value-container">
              <FilterLabel
                name="author"
                label={
                  safeFilters.find((f) => f.name === 'author')?.value || ''
                }
                filterId="author"
                onRemoveTag={onRemoveTag}
                onRemoveFilter={handleFilterRemove}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mentions filter */}
      {safeFilters.find((f) => f.name === 'mentions') && (
        <div key="mentions-filter" className="filter-bar__filter">
          <p className="uppercase filter-bar__filter-name">mentions:</p>
          <div className="filter-bar__filter-values-container">
            <div className="filter-bar__filter-value-container">
              <FilterLabel
                name="mentions"
                label={`@${safeFilters.find((f) => f.name === 'mentions')?.value}`}
                filterId="mentions"
                onRemoveTag={onRemoveTag}
                onRemoveFilter={handleFilterRemove}
              />
            </div>
          </div>
        </div>
      )}

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
