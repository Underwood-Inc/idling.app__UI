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
      {/* Global Logic Toggle - only show when multiple filter types are active */}
      {hasMultipleFilterTypes && onUpdateFilter && (
        <div className="filter-bar__global-logic">
          <span className="filter-bar__logic-label">Filter Groups:</span>
          <button
            className={`filter-bar__logic-button ${globalLogic === 'AND' ? 'filter-bar__logic-button--active' : ''}`}
            onClick={() => handleLogicToggle('globalLogic')}
            title={`Currently using ${globalLogic} logic between filter groups. Click to toggle.`}
          >
            {globalLogic === 'AND' ? 'ALL' : 'ANY'}
          </button>
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

          const renderValues = () =>
            values.map((value) => (
              <div key={value} className="filter-bar__filter-value-container">
                <FilterLabel
                  name={filter.name}
                  label={value}
                  filterId={filterId}
                  onRemoveTag={onRemoveTag}
                  onRemoveFilter={handleFilterRemoveString}
                />
              </div>
            ));

          return (
            <div key={filter.name} className="filter-bar__filter">
              <div className="filter-bar__filter-header">
                <p className="uppercase filter-bar__filter-name">
                  {filter.name}:
                </p>

                {/* Logic toggle for specific filter types */}
                {filter.name === 'tags' &&
                  filter.value.includes(',') &&
                  onUpdateFilter && (
                    <button
                      className={`filter-bar__logic-toggle ${tagLogic === 'AND' ? 'filter-bar__logic-toggle--active' : ''}`}
                      onClick={() => handleLogicToggle('tagLogic')}
                      title={`Tags: ${tagLogic === 'AND' ? 'Must have ALL selected tags' : 'Must have ANY selected tag'}`}
                    >
                      {tagLogic === 'AND' ? 'ALL' : 'ANY'}
                    </button>
                  )}

                {filter.name === 'author' && onUpdateFilter && (
                  <button
                    className={`filter-bar__logic-toggle ${authorLogic === 'AND' ? 'filter-bar__logic-toggle--active' : ''}`}
                    onClick={() => handleLogicToggle('authorLogic')}
                    title={`Authors: ${authorLogic === 'AND' ? 'Must match ALL authors' : 'Must match ANY author'}`}
                    style={{ opacity: 0.6 }}
                  >
                    {authorLogic === 'AND' ? 'ALL' : 'ANY'}
                  </button>
                )}

                {filter.name === 'mentions' && onUpdateFilter && (
                  <button
                    className={`filter-bar__logic-toggle ${mentionsLogic === 'AND' ? 'filter-bar__logic-toggle--active' : ''}`}
                    onClick={() => handleLogicToggle('mentionsLogic')}
                    title={`Mentions: ${mentionsLogic === 'AND' ? 'Must mention ALL users' : 'Must mention ANY user'}`}
                    style={{ opacity: 0.6 }}
                  >
                    {mentionsLogic === 'AND' ? 'ALL' : 'ANY'}
                  </button>
                )}
              </div>
              <div className="filter-bar__filter-values-container">
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
