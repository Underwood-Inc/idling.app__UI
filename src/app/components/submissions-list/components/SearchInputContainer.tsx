'use client';

import React, { useCallback, useState } from 'react';
import { InteractiveTooltip } from '../../tooltip/InteractiveTooltip';
import { SmartFilterInput } from './SmartFilterInput';

export interface SearchInputContainerProps {
  enableSmartInput?: boolean;
  contextId?: string;
  currentValue: string;
  onSmartInputChange?: (newValue: string) => void;
  onMentionClick?: (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => void;
  onPillClick?: (pill: string) => void;
  onAddFilter?: (filter: any) => void;
  onAddFilters?: (filters: any[]) => void;
  onRemoveFilter?: (name: any, value?: any) => void;
  onFilterSuccess?: () => void;
  onSearch?: (searchText: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  hasValue?: boolean;
  onClear?: () => void;
  showRepliesFilter?: boolean;
  includeThreadReplies?: boolean;
  onlyReplies?: boolean;
  onToggleThreadReplies?: (checked: boolean) => void;
  onToggleOnlyReplies?: (checked: boolean) => void;
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
  onBlur,
  placeholder,
  isLoading,
  hasValue,
  onClear,
  showRepliesFilter = false,
  includeThreadReplies = false,
  onlyReplies = false,
  onToggleThreadReplies,
  onToggleOnlyReplies
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
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  // Determine if we have a value (for clear button visibility)
  const actualHasValue = shouldUseSmartInput
    ? smartInputValue.length > 0
    : hasValue;

  // Determine replies filter state and styling
  const getRepliesFilterState = () => {
    if (onlyReplies) return 'only-replies';
    if (includeThreadReplies) return 'active';
    return 'inactive';
  };

  const getRepliesFilterLabel = () => {
    if (onlyReplies) return 'Only Replies';
    if (includeThreadReplies) return 'With Replies';
    return 'Replies';
  };

  const getRepliesFilterIcon = () => {
    if (onlyReplies) return '💬';
    if (includeThreadReplies) return '💬';
    return '💬';
  };

  const handleRepliesOptionClick = (option: 'none' | 'thread' | 'only') => {
    switch (option) {
      case 'none':
        onToggleThreadReplies?.(false);
        onToggleOnlyReplies?.(false);
        break;
      case 'thread':
        onToggleThreadReplies?.(true);
        onToggleOnlyReplies?.(false);
        break;
      case 'only':
        onToggleThreadReplies?.(false);
        onToggleOnlyReplies?.(true);
        break;
    }
  };

  // Create the dropdown content for the InteractiveTooltip
  const repliesDropdownContent = (
    <div className="text-search-input__replies-dropdown-content">
      <div
        className={`text-search-input__replies-option ${!includeThreadReplies && !onlyReplies ? 'text-search-input__replies-option--active' : ''}`}
        onClick={() => handleRepliesOptionClick('none')}
      >
        <div className="text-search-input__replies-option-icon">📝</div>
        <div className="text-search-input__replies-option-text">
          <div>Main Posts Only</div>
          <div className="text-search-input__replies-option-description">
            Show only original posts
          </div>
        </div>
      </div>

      <div
        className={`text-search-input__replies-option ${includeThreadReplies && !onlyReplies ? 'text-search-input__replies-option--active' : ''}`}
        onClick={() => handleRepliesOptionClick('thread')}
      >
        <div className="text-search-input__replies-option-icon">💬</div>
        <div className="text-search-input__replies-option-text">
          <div>With Replies</div>
          <div className="text-search-input__replies-option-description">
            Show posts with their replies
          </div>
        </div>
      </div>

      <div
        className={`text-search-input__replies-option ${onlyReplies ? 'text-search-input__replies-option--active' : ''}`}
        onClick={() => handleRepliesOptionClick('only')}
      >
        <div className="text-search-input__replies-option-icon">↩️</div>
        <div className="text-search-input__replies-option-text">
          <div>Only Replies</div>
          <div className="text-search-input__replies-option-description">
            Show only reply posts
          </div>
        </div>
      </div>
    </div>
  );

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
          onBlur={onBlur}
          placeholder={placeholder}
          className="text-search-input__field"
          autoComplete="off"
          spellCheck="false"
        />
      )}

      {/* Combined Replies Filter with InteractiveTooltip */}
      {showRepliesFilter && (
        <InteractiveTooltip
          content={repliesDropdownContent}
          triggerOnClick={true}
          className="text-search-input__replies-tooltip"
        >
          <div
            className={`text-search-input__replies-filter text-search-input__replies-filter--${getRepliesFilterState()}`}
            title="Configure reply filtering options"
          >
            <div className="text-search-input__replies-icon">
              {getRepliesFilterIcon()}
            </div>
            <span className="text-search-input__replies-label">
              {getRepliesFilterLabel()}
            </span>
          </div>
        </InteractiveTooltip>
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
