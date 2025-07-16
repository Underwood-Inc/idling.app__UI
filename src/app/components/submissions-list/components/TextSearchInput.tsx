'use client';

import React from 'react';
import { useFilterStatus, type FilterCounts } from './hooks/useFilterStatus';
import { useTextSearchInput } from './hooks/useTextSearchInput';
import { SearchInputContainer } from './SearchInputContainer';
import { SearchStatus } from './SearchStatus';
import './TextSearchInput.css';

export interface TextSearchInputProps {
  onSearch: (searchText: string) => void;
  contextId?: string;
  placeholder?: string;
  minLength?: number;
  className?: string;
  initialValue?: string;
  value?: string; // Controlled value
  onChange?: (value: string) => void; // Controlled change handler
  onKeyDown?: (e: React.KeyboardEvent) => void; // Key event handler
  onBlur?: () => void; // Blur event handler
  // Combined replies filter
  showRepliesFilter?: boolean;
  includeThreadReplies?: boolean;
  onlyReplies?: boolean;
  onToggleThreadReplies?: (checked: boolean) => void;
  onToggleOnlyReplies?: (checked: boolean) => void;
  isLoading?: boolean;
  // Smart input features
  enableSmartInput?: boolean;
  onMentionClick?: (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => void;
  onPillClick?: (pill: string) => void;
  // Filter management callbacks for smart input
  onAddFilter?: (filter: any) => void;
  onAddFilters?: (filters: any[]) => void;
  onRemoveFilter?: (name: any, value?: any) => void;
  onFilterSuccess?: () => void;
  onClearFilters?: () => void;
  // Enhanced filter information
  filterCounts?: FilterCounts;
  totalActiveFilters?: number;
}

export const TextSearchInput: React.FC<TextSearchInputProps> = ({
  onSearch,
  contextId,
  placeholder = 'Search posts content... (or use @user #tag for filters)',
  minLength = 2,
  className = '',
  initialValue = '',
  value,
  onChange,
  onKeyDown,
  onBlur,
  showRepliesFilter = false,
  includeThreadReplies = false,
  onlyReplies = false,
  onToggleThreadReplies,
  onToggleOnlyReplies,
  isLoading = false,
  enableSmartInput = false,
  onMentionClick,
  onPillClick,
  onAddFilter,
  onAddFilters,
  onRemoveFilter,
  onFilterSuccess,
  onClearFilters,
  filterCounts,
  totalActiveFilters
}) => {
  // Use custom hooks for logic
  const searchInput = useTextSearchInput({
    initialValue,
    value,
    onChange,
    onSearch,
    minLength
  });

  const filterStatus = useFilterStatus({
    filterCounts,
    totalActiveFilters,
    hasValidSearch: searchInput.hasValidSearch,
    searchTerms: searchInput.searchTerms
  });

  // Create custom clear handler for smart input mode
  const handleClear =
    enableSmartInput && onClearFilters
      ? onClearFilters // Clear all filters in smart mode
      : searchInput.handleClear; // Clear only search in regular mode

  // Combine key handlers - use custom onKeyDown if provided, otherwise use default
  const handleKeyDown = onKeyDown || searchInput.handleKeyDown;

  // Determine container class
  const containerClass = [
    'text-search-input',
    enableSmartInput && contextId ? 'text-search-input--smart' : '',
    showRepliesFilter ? 'text-search-input--with-replies-filter' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      <SearchInputContainer
        enableSmartInput={enableSmartInput}
        contextId={contextId}
        currentValue={searchInput.currentValue}
        onSmartInputChange={searchInput.handleSmartInputChange}
        onMentionClick={onMentionClick}
        onPillClick={onPillClick}
        onAddFilter={onAddFilter}
        onAddFilters={onAddFilters}
        onRemoveFilter={onRemoveFilter}
        onFilterSuccess={onFilterSuccess}
        onSearch={onSearch}
        inputRef={searchInput.inputRef}
        onInputChange={searchInput.handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        isLoading={isLoading}
        hasValue={searchInput.hasValue}
        onClear={handleClear}
        showRepliesFilter={Boolean(showRepliesFilter)}
        includeThreadReplies={Boolean(includeThreadReplies)}
        onlyReplies={Boolean(onlyReplies)}
        onToggleThreadReplies={onToggleThreadReplies}
        onToggleOnlyReplies={onToggleOnlyReplies}
      />

      {filterStatus.statusText && Boolean(filterStatus.shouldShowStatus) && (
        <SearchStatus>{filterStatus.statusText}</SearchStatus>
      )}
    </div>
  );
};
