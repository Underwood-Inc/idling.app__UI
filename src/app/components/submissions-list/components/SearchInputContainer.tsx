import React, { useCallback, useState } from 'react';
import { SmartFilterInput } from './SmartFilterInput';

interface SearchInputContainerProps {
  // Smart input mode
  enableSmartInput?: boolean;
  contextId?: string;
  currentValue: string;
  onSmartInputChange: (value: string) => void;
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
  onSearch?: (searchText: string) => void;

  // Regular input mode
  inputRef: React.RefObject<HTMLInputElement>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Common props
  placeholder: string;
  isLoading: boolean;
  hasValue: boolean;
  onClear: () => void;

  // Thread toggle
  showThreadToggle?: boolean;
  includeThreadReplies?: boolean;
  onToggleThreadReplies?: (checked: boolean) => void;
}

export const SearchInputContainer: React.FC<SearchInputContainerProps> = ({
  enableSmartInput,
  contextId,
  currentValue,
  onSmartInputChange,
  onMentionClick,
  onPillClick,
  onAddFilter,
  onAddFilters,
  onRemoveFilter,
  onFilterSuccess,
  onSearch,
  inputRef,
  onInputChange,
  onKeyDown,
  placeholder,
  isLoading,
  hasValue,
  onClear,
  showThreadToggle,
  includeThreadReplies,
  onToggleThreadReplies
}) => {
  const shouldUseSmartInput = enableSmartInput && contextId;
  const [smartInputValue, setSmartInputValue] = useState('');

  // Handle smart input value changes for clear button visibility
  const handleSmartInputValueChange = useCallback((value: string) => {
    setSmartInputValue(value);
  }, []);

  // Handle clear for smart input - clear both input and filters
  const handleSmartInputClear = useCallback(() => {
    setSmartInputValue('');
    // Call onClear which should clear all filters
    onClear();
  }, [onClear]);

  // Determine if we have a value (for clear button visibility)
  const actualHasValue = shouldUseSmartInput
    ? smartInputValue.length > 0
    : hasValue;

  return (
    <div className="text-search-input__container">
      {/* Search Icon */}
      <div className="text-search-input__icon">
        {isLoading ? (
          <div className="text-search-input__spinner" />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )}
      </div>

      {/* Input Field */}
      {shouldUseSmartInput ? (
        <SmartFilterInput
          onMentionClick={onMentionClick}
          onPillClick={onPillClick}
          onAddFilter={onAddFilter}
          onAddFilters={onAddFilters}
          onRemoveFilter={onRemoveFilter}
          onFilterSuccess={onFilterSuccess}
          onSearch={onSearch}
          onClearFilters={onClear}
          onValueChange={handleSmartInputValueChange}
          placeholder={placeholder}
          className="text-search-input__smart-field"
          contextId={contextId}
          enableHashtags={true}
          enableUserMentions={true}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="text-search-input__field"
          autoComplete="off"
          spellCheck="false"
        />
      )}

      {/* Thread Toggle Overlay */}
      {showThreadToggle && onToggleThreadReplies && (
        <div
          className={`text-search-input__thread-toggle ${includeThreadReplies ? 'text-search-input__thread-toggle--active' : ''}`}
          onClick={() => onToggleThreadReplies(!includeThreadReplies)}
          title={`${includeThreadReplies ? 'Disable' : 'Enable'} thread replies in search results`}
        >
          <div
            className={`text-search-input__thread-switch ${includeThreadReplies ? 'text-search-input__thread-switch--active' : ''}`}
          />
          <span className="text-search-input__thread-label">Replies</span>
        </div>
      )}

      {/* Clear Button */}
      {actualHasValue && (
        <button
          type="button"
          onClick={shouldUseSmartInput ? handleSmartInputClear : onClear}
          className="text-search-input__clear"
          aria-label="Clear search"
          title="Clear search (Esc)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};
