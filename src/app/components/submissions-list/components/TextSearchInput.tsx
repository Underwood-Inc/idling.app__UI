'use client';

import { createLogger } from '@/lib/logging';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './TextSearchInput.css';

const logger = createLogger({
  context: { component: 'TextSearchInput' }
});

export interface TextSearchInputProps {
  onSearch: (searchText: string) => void;
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  className?: string;
  initialValue?: string;
}

export const TextSearchInput: React.FC<TextSearchInputProps> = ({
  onSearch,
  placeholder = 'Search posts content...',
  debounceMs = 300,
  minLength = 2,
  className = '',
  initialValue = ''
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse search terms from input
  const parseSearchTerms = useCallback(
    (text: string): string[] => {
      return text
        .trim()
        .split(/\s+/)
        .filter((term) => term.length >= minLength)
        .map((term) => term.toLowerCase());
    },
    [minLength]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchText: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const terms = parseSearchTerms(searchText);
        setSearchTerms(terms);
        setIsSearching(false);

        logger.debug('Text search executed', {
          searchText,
          terms,
          termCount: terms.length
        });

        onSearch(searchText);
      }, debounceMs);
    },
    [onSearch, debounceMs, parseSearchTerms]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim().length === 0) {
      // Clear search immediately when input is empty
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setSearchTerms([]);
      setIsSearching(false);
      onSearch('');
      return;
    }

    if (value.trim().length >= minLength) {
      setIsSearching(true);
      debouncedSearch(value);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue('');
    setSearchTerms([]);
    setIsSearching(false);
    onSearch('');
    inputRef.current?.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    } else if (e.key === 'Enter') {
      // Trigger immediate search on Enter
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const terms = parseSearchTerms(inputValue);
      setSearchTerms(terms);
      setIsSearching(false);
      onSearch(inputValue);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasValue = inputValue.length > 0;
  const hasValidSearch = searchTerms.length > 0;

  return (
    <div className={`text-search-input ${className}`}>
      <div className="text-search-input__container">
        {/* Search Icon */}
        <div className="text-search-input__icon">
          {isSearching ? (
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
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-search-input__field"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
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

      {/* Search Terms Display */}
      {hasValidSearch && (
        <div className="text-search-input__terms">
          <span className="text-search-input__terms-label">Searching for:</span>
          <div className="text-search-input__terms-list">
            {searchTerms.map((term, index) => (
              <span key={index} className="text-search-input__term">
                {term}
              </span>
            ))}
          </div>
          <span className="text-search-input__terms-logic">(any match)</span>
        </div>
      )}

      {/* Search Help */}
      {hasValue && !hasValidSearch && (
        <div className="text-search-input__help">
          <span className="text-search-input__help-text">
            Type at least {minLength} characters to search
          </span>
        </div>
      )}
    </div>
  );
};
