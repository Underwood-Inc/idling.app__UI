'use client';

import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import './FilterBar.css';
import { FilterLabel } from './FilterLabel';
import { getTagsFromSearchParams } from './utils/get-tags';

function dedupeStringArray(arr: string[]): string[] {
  return [...new Set(arr)];
}

interface FilterBarProps {
  filterId: string;
  filters: Filter<PostFilters>[];
  onRemoveFilter: (filterType: PostFilters) => void;
  onRemoveTag: (tagToRemove: string) => void;
  onClearFilters: () => void;
  onUpdateFilter?: (name: string, value: string) => void;
}

export default function FilterBar({
  filterId,
  filters,
  onRemoveFilter,
  onRemoveTag,
  onClearFilters,
  onUpdateFilter
}: FilterBarProps) {
  // Add null check for filters
  const safeFilters = filters || [];

  // Enhanced logic: if filters is empty or undefined, don't render
  if (!safeFilters || safeFilters.length === 0) {
    return null;
  }

  const handleFilterRemove = (filterName: PostFilters) => {
    onRemoveFilter(filterName);
  };

  const handleFilterRemoveString = (filterName: string) => {
    onRemoveFilter(filterName as PostFilters);
  };

  const handleClearFilters = () => {
    onClearFilters();
  };

  // Get logic values from filters
  const tagLogic =
    safeFilters.find((f) => f.name === 'tagLogic')?.value || 'OR';
  const authorLogic =
    safeFilters.find((f) => f.name === 'authorLogic')?.value || 'OR';
  const mentionsLogic =
    safeFilters.find((f) => f.name === 'mentionsLogic')?.value || 'OR';
  const globalLogic =
    safeFilters.find((f) => f.name === 'globalLogic')?.value || 'AND';

  const hasTagsFilter = safeFilters.some((f) => f.name === 'tags');
  const hasAuthorFilter = safeFilters.some((f) => f.name === 'author');
  const hasMentionsFilter = safeFilters.some((f) => f.name === 'mentions');
  const hasMultipleFilterTypes =
    [hasTagsFilter, hasAuthorFilter, hasMentionsFilter].filter(Boolean).length >
    1;

  const handleLogicToggle = (
    filterType: 'tagLogic' | 'authorLogic' | 'mentionsLogic' | 'globalLogic'
  ) => {
    if (!onUpdateFilter) return;

    const currentValue =
      safeFilters.find((f) => f.name === filterType)?.value ||
      (filterType === 'globalLogic' ? 'AND' : 'OR');
    const newValue = currentValue === 'AND' ? 'OR' : 'AND';
    onUpdateFilter(filterType, newValue);
  };

  return (
    <article className="filter-bar__container">
      {/* Compact filter display with integrated global logic */}
      <div className="filter-bar__filters-compact">
        {/* Global Logic Toggle - inline with filters when multiple filter types are active */}
        {hasMultipleFilterTypes && onUpdateFilter && (
          <div className="filter-bar__global-logic-inline">
            <span className="filter-bar__logic-label">Groups:</span>
            <div className="filter-bar__logic-button-group">
              <button
                className={`filter-bar__logic-button ${globalLogic === 'AND' ? 'filter-bar__logic-button--active' : ''}`}
                onClick={() => onUpdateFilter('globalLogic', 'AND')}
                title="All filter groups must match"
              >
                ALL
              </button>
              <button
                className={`filter-bar__logic-button ${globalLogic === 'OR' ? 'filter-bar__logic-button--active' : ''}`}
                onClick={() => onUpdateFilter('globalLogic', 'OR')}
                title="Any filter group can match"
              >
                ANY
              </button>
            </div>
          </div>
        )}

        {safeFilters
          .filter(
            (filter) =>
              ![
                'tagLogic',
                'authorLogic',
                'mentionsLogic',
                'globalLogic'
              ].includes(filter.name)
          )
          .map((filter) => {
            if (!filter.value) {
              return null;
            }

            // For tags, handle comma-separated values
            const values =
              filter.name === 'tags'
                ? dedupeStringArray(getTagsFromSearchParams(filter.value))
                : [filter.value]; // For author/mentions, single value

            if (values.length === 0) {
              return null;
            }

            return (
              <div key={filter.name} className="filter-bar__filter-compact">
                <div className="filter-bar__filter-inline">
                  <span className="filter-bar__filter-label">
                    {filter.name}:
                  </span>

                  {/* Logic toggle for multi-value filters */}
                  {filter.name === 'tags' &&
                    filter.value.includes(',') &&
                    onUpdateFilter && (
                      <div className="filter-bar__logic-toggle-group">
                        <button
                          className={`filter-bar__logic-toggle ${tagLogic === 'AND' ? 'filter-bar__logic-toggle--active' : ''}`}
                          onClick={() => onUpdateFilter('tagLogic', 'AND')}
                          title="Must have ALL selected tags"
                        >
                          ALL
                        </button>
                        <button
                          className={`filter-bar__logic-toggle ${tagLogic === 'OR' ? 'filter-bar__logic-toggle--active' : ''}`}
                          onClick={() => onUpdateFilter('tagLogic', 'OR')}
                          title="Must have ANY selected tag"
                        >
                          ANY
                        </button>
                      </div>
                    )}

                  {/* Filter values */}
                  <div className="filter-bar__filter-values-inline">
                    {values.map((value) => (
                      <div
                        key={value}
                        className="filter-bar__filter-value-container"
                      >
                        <FilterLabel
                          name={filter.name}
                          label={value}
                          filterId={filterId}
                          onRemoveTag={onRemoveTag}
                          onRemoveFilter={handleFilterRemoveString}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

        {safeFilters.length > 0 && (
          <button
            className="filter-bar__clear-all-button-compact"
            onClick={handleClearFilters}
            aria-label="Clear all filters"
            title="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>
    </article>
  );
}
