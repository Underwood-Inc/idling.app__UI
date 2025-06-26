'use client';

import { useAtom } from 'jotai';
import { Filter, getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import './FilterBar.css';
import { FilterLabel } from './FilterLabel';

function dedupeStringArray(arr: string[]): string[] {
  return [...new Set(arr)];
}

interface FilterBarProps {
  filterId: string;
  filters: Filter<PostFilters>[];
  onRemoveFilter: (filterType: PostFilters, filterValue?: string) => void;
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
  // Add direct Jotai access for debugging
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(filterId)
  );

  // Add null check for filters
  const safeFilters = filters || [];

  // Enhanced logic: if filters is empty or undefined, don't render
  if (!safeFilters || safeFilters.length === 0) {
    return null;
  }

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
  const searchLogic =
    safeFilters.find((f) => f.name === 'searchLogic')?.value || 'OR';
  const globalLogic =
    safeFilters.find((f) => f.name === 'globalLogic')?.value || 'AND';

  const hasTagsFilter = safeFilters.some((f) => f.name === 'tags');
  const hasAuthorFilter = safeFilters.some((f) => f.name === 'author');
  const hasMentionsFilter = safeFilters.some((f) => f.name === 'mentions');
  const hasSearchFilter = safeFilters.some((f) => f.name === 'search');
  const filterTypeCount = [
    hasTagsFilter,
    hasAuthorFilter,
    hasMentionsFilter,
    hasSearchFilter
  ].filter(Boolean).length;
  const hasMultipleFilterTypes = filterTypeCount > 1;

  // Auto-switch global logic to OR when there's only one filter type
  // This prevents the confusing state where global=ALL but there's only one group
  const effectiveGlobalLogic = hasMultipleFilterTypes ? globalLogic : 'OR';

  // If we need to update the stored global logic to match the effective logic
  if (
    onUpdateFilter &&
    globalLogic !== effectiveGlobalLogic &&
    !hasMultipleFilterTypes
  ) {
    // Automatically switch to OR when there's only one filter type
    setTimeout(() => onUpdateFilter('globalLogic', 'OR'), 0);
  }

  const handleLogicToggle = (
    filterType: 'tagLogic' | 'authorLogic' | 'mentionsLogic' | 'globalLogic'
  ) => {
    if (!onUpdateFilter) return;

    const currentValue =
      safeFilters.find((f) => f.name === filterType)?.value ||
      (filterType === 'globalLogic' ? 'AND' : 'OR');
    const newValue = currentValue === 'AND' ? 'OR' : 'AND';

    // Use consistent update mechanism for all filter types
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
                className={`filter-bar__logic-button ${effectiveGlobalLogic === 'AND' ? 'filter-bar__logic-button--active' : ''}`}
                onClick={() => onUpdateFilter('globalLogic', 'AND')}
                title="All filter groups must match"
              >
                ALL
              </button>
              <button
                className={`filter-bar__logic-button ${effectiveGlobalLogic === 'OR' ? 'filter-bar__logic-button--active' : ''}`}
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
                'searchLogic',
                'globalLogic'
              ].includes(filter.name)
          )
          // Group filters by name to consolidate multiple values
          // Exception: author and mentions filters should remain separate instances
          .reduce((acc, filter) => {
            if (filter.name === 'author' || filter.name === 'mentions') {
              // Keep user filters as separate instances
              acc.push({ ...filter });
            } else {
              // Consolidate other filter types (tags, search)
              const existingFilter = acc.find((f) => f.name === filter.name);
              if (existingFilter) {
                // Consolidate values with comma separation
                existingFilter.value =
                  existingFilter.value + ',' + filter.value;
              } else {
                acc.push({ ...filter });
              }
            }
            return acc;
          }, [] as Filter<PostFilters>[])
          .map((filter, filterIndex) => {
            if (!filter.value) {
              return null;
            }

            // Handle comma-separated values for all filter types
            let values: string[];
            let hasMultipleValues: boolean;

            if (filter.name === 'search') {
              // For search filters, parse the search text to find individual terms
              const searchTerms: string[] = [];
              const regex = /"([^"]+)"|(\S+)/g;
              let match;

              while ((match = regex.exec(filter.value)) !== null) {
                const quotedTerm = match[1]; // Captured quoted content
                const unquotedTerm = match[2]; // Captured unquoted content

                const term = quotedTerm || unquotedTerm;
                if (term && term.length >= 1) {
                  searchTerms.push(term);
                }
              }

              values = searchTerms;
              hasMultipleValues = searchTerms.length > 1;
            } else {
              // For other filter types, use comma separation
              values = dedupeStringArray(
                filter.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter((v) => v)
              );
              hasMultipleValues = values.length > 1;
            }

            if (values.length === 0) {
              return null;
            }

            // When globalLogic is AND, force all individual filters to AND
            // When globalLogic is OR, use individual filter logic settings
            const effectiveLogic =
              effectiveGlobalLogic === 'AND'
                ? 'AND'
                : filter.name === 'tags'
                  ? tagLogic
                  : filter.name === 'author'
                    ? authorLogic
                    : filter.name === 'mentions'
                      ? mentionsLogic
                      : filter.name === 'search'
                        ? searchLogic
                        : 'OR';

            const currentLogic = effectiveLogic;

            return (
              <div
                key={`${filter.name}-${filter.value}-${filterIndex}-consolidated`}
                className="filter-bar__filter-compact"
              >
                <div className="filter-bar__filter-inline">
                  <span className="filter-bar__filter-label">
                    {filter.name}:
                  </span>

                  {/* Logic toggle for multi-value filters */}
                  {hasMultipleValues && onUpdateFilter && (
                    <div className="filter-bar__logic-toggle-inline">
                      <div className="filter-bar__logic-button-group">
                        <button
                          className={`filter-bar__logic-button ${
                            currentLogic === 'AND'
                              ? 'filter-bar__logic-button--active'
                              : ''
                          } ${effectiveGlobalLogic === 'AND' ? 'filter-bar__logic-button--disabled' : ''}`}
                          onClick={() => {
                            // Only allow changes when globalLogic is OR
                            if (effectiveGlobalLogic === 'OR') {
                              const logicType =
                                filter.name === 'tags'
                                  ? 'tagLogic'
                                  : filter.name === 'author'
                                    ? 'authorLogic'
                                    : filter.name === 'mentions'
                                      ? 'mentionsLogic'
                                      : filter.name === 'search'
                                        ? 'searchLogic'
                                        : 'tagLogic';
                              onUpdateFilter(logicType, 'AND');
                            }
                          }}
                          disabled={effectiveGlobalLogic === 'AND'}
                          title={
                            effectiveGlobalLogic === 'AND'
                              ? `Controlled by Groups setting - set Groups to ANY to change`
                              : `Must have ALL selected ${filter.name}`
                          }
                        >
                          ALL
                        </button>
                        <button
                          className={`filter-bar__logic-button ${
                            currentLogic === 'OR'
                              ? 'filter-bar__logic-button--active'
                              : ''
                          } ${effectiveGlobalLogic === 'AND' ? 'filter-bar__logic-button--disabled' : ''}`}
                          onClick={() => {
                            // Only allow changes when globalLogic is OR
                            if (effectiveGlobalLogic === 'OR') {
                              const logicType =
                                filter.name === 'tags'
                                  ? 'tagLogic'
                                  : filter.name === 'author'
                                    ? 'authorLogic'
                                    : filter.name === 'mentions'
                                      ? 'mentionsLogic'
                                      : filter.name === 'search'
                                        ? 'searchLogic'
                                        : 'tagLogic';
                              onUpdateFilter(logicType, 'OR');
                            }
                          }}
                          disabled={effectiveGlobalLogic === 'AND'}
                          title={
                            effectiveGlobalLogic === 'AND'
                              ? `Controlled by Groups setting - set Groups to ANY to change`
                              : `Must have ANY selected ${filter.name}`
                          }
                        >
                          ANY
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Filter values */}
                  <div className="filter-bar__filter-values-inline">
                    {values.map((value, valueIndex) => (
                      <div
                        key={`${filter.name}-${value}-${valueIndex}`}
                        className="filter-bar__filter-value-container"
                      >
                        <FilterLabel
                          name={filter.name}
                          label={value}
                          filterId={filterId}
                          onRemoveTag={onRemoveTag}
                          onRemoveFilter={(filterName, filterValue) =>
                            onRemoveFilter(
                              filterName as PostFilters,
                              filterValue
                            )
                          }
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
