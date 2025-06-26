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
  // Thread replies toggle
  showThreadToggle?: boolean;
  includeThreadReplies?: boolean;
  onToggleThreadReplies?: (checked: boolean) => void;
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
  showThreadToggle = false,
  includeThreadReplies = false,
  onToggleThreadReplies,
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

  // Determine container class
  const containerClass = [
    'text-search-input',
    enableSmartInput && contextId ? 'text-search-input--smart' : '',
    showThreadToggle ? 'text-search-input--with-thread-toggle' : '',
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
        onKeyDown={searchInput.handleKeyDown}
        placeholder={placeholder}
        isLoading={isLoading}
        hasValue={searchInput.hasValue}
        onClear={handleClear}
        showThreadToggle={Boolean(showThreadToggle)}
        includeThreadReplies={Boolean(includeThreadReplies)}
        onToggleThreadReplies={onToggleThreadReplies}
      />

      {filterStatus.statusText && Boolean(filterStatus.shouldShowStatus) && (
        <SearchStatus>{filterStatus.statusText}</SearchStatus>
      )}
    </div>
  );
};
