'use client';

import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from 'react';
import './InlineSuggestionInput.css';

export interface SuggestionItem {
  id: string;
  value: string; // For users, this is the author_id
  label: string;
  displayName?: string; // For users, this is the author name for display
  avatar?: string;
  type: 'hashtag' | 'user';
}

export interface InlineSuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onHashtagSearch?: (
    query: string,
    page?: number
  ) => Promise<{
    items: SuggestionItem[];
    hasMore: boolean;
    total: number;
  }>;
  onUserSearch?: (
    query: string,
    page?: number
  ) => Promise<{
    items: SuggestionItem[];
    hasMore: boolean;
    total: number;
  }>;
  maxSuggestions?: number;
  minQueryLength?: number;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const InlineSuggestionInput: React.FC<InlineSuggestionInputProps> = ({
  value,
  onChange,
  onPaste,
  placeholder,
  className = '',
  disabled = false,
  onHashtagSearch,
  onUserSearch,
  maxSuggestions = 10,
  minQueryLength = 2,
  as = 'input',
  rows = 3
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentTrigger, setCurrentTrigger] = useState<'#' | '@' | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [triggerStartIndex, setTriggerStartIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionListRef = useRef<HTMLDivElement>(null);

  // Enhanced trigger detection that persists through spaces
  const detectTriggerAndQuery = (text: string, position: number) => {
    const beforeCursor = text.substring(0, position);

    // Find last occurrence of # or @ before cursor
    const hashIndex = beforeCursor.lastIndexOf('#');
    const atIndex = beforeCursor.lastIndexOf('@');

    const lastTriggerIndex = Math.max(hashIndex, atIndex);

    if (lastTriggerIndex === -1) {
      return { trigger: null, query: '', startIndex: -1 };
    }

    const trigger = text[lastTriggerIndex] as '#' | '@';
    const afterTrigger = beforeCursor.substring(lastTriggerIndex + 1);

    // For @ mentions, continue searching until we find a closing bracket or end of meaningful content
    if (trigger === '@') {
      // If we already have a complete mention @[username|userId], don't trigger search
      const completeStructuredMention = text
        .substring(lastTriggerIndex)
        .match(/^@\[[^\]]+\]/);
      if (
        completeStructuredMention &&
        lastTriggerIndex + completeStructuredMention[0].length <= position
      ) {
        return { trigger: null, query: '', startIndex: -1 };
      }

      // For @ mentions, allow spaces in the query until we hit certain terminating characters
      const terminatingChars = /[.,!?;:\n\r\t]/;
      if (terminatingChars.test(afterTrigger)) {
        return { trigger: null, query: '', startIndex: -1 };
      }

      // Continue search with spaces allowed for user mentions
      return {
        trigger,
        query: afterTrigger.trim(),
        startIndex: lastTriggerIndex
      };
    } else {
      // For hashtags, stop at first space (original behavior)
      if (afterTrigger.includes(' ')) {
        return { trigger: null, query: '', startIndex: -1 };
      }

      return {
        trigger,
        query: afterTrigger,
        startIndex: lastTriggerIndex
      };
    }
  };

  // Enhanced search with pagination support
  const searchSuggestions = async (
    trigger: '#' | '@',
    query: string,
    page: number = 1,
    append: boolean = false
  ) => {
    if (query.length < minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasMore(false);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);

    try {
      let result: { items: SuggestionItem[]; hasMore: boolean; total: number } =
        {
          items: [],
          hasMore: false,
          total: 0
        };

      if (trigger === '#' && onHashtagSearch) {
        result = await onHashtagSearch(query, page);
      } else if (trigger === '@' && onUserSearch) {
        result = await onUserSearch(query, page);
      }

      if (append) {
        setSuggestions((prev) => [...prev, ...result.items]);
      } else {
        setSuggestions(result.items);
        setSelectedIndex(-1);
      }

      setHasMore(result.hasMore);
      setTotalResults(result.total);
      setShowSuggestions(result.items.length > 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching suggestions:', error);
      if (!append) {
        setSuggestions([]);
        setShowSuggestions(false);
        setHasMore(false);
        setTotalResults(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load more results
  const loadMore = async () => {
    if (!hasMore || isLoading || !currentTrigger || !currentQuery) return;

    await searchSuggestions(
      currentTrigger,
      currentQuery,
      currentPage + 1,
      true
    );
  };

  // Handle input change
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    const { trigger, query, startIndex } = detectTriggerAndQuery(
      newValue,
      newCursorPosition
    );

    setCurrentTrigger(trigger);
    setCurrentQuery(query);
    setTriggerStartIndex(startIndex);

    if (trigger && query !== currentQuery) {
      // Reset pagination when query changes
      setCurrentPage(1);
      searchSuggestions(trigger, query, 1, false);
    } else if (!trigger) {
      setShowSuggestions(false);
      setSuggestions([]);
      setHasMore(false);
      setTotalResults(0);
    }
  };

  // Handle cursor position changes
  const handleCursorPositionChange = (
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const newCursorPosition = target.selectionStart || 0;
    setCursorPosition(newCursorPosition);

    const { trigger, query, startIndex } = detectTriggerAndQuery(
      value,
      newCursorPosition
    );

    setCurrentTrigger(trigger);
    setCurrentQuery(query);
    setTriggerStartIndex(startIndex);

    if (!trigger) {
      setShowSuggestions(false);
      setSuggestions([]);
      setHasMore(false);
      setTotalResults(0);
    }
  };

  // Handle keyboard navigation with pagination support
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectedIndex < suggestions.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        } else if (hasMore && !isLoading) {
          // Load more when reaching the end
          loadMore();
        } else {
          setSelectedIndex(0);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        setHasMore(false);
        setTotalResults(0);
        break;
      case 'PageDown':
        e.preventDefault();
        if (hasMore && !isLoading) {
          loadMore();
        }
        break;
    }
  };

  // Insert selected suggestion
  const insertSuggestion = (suggestion: SuggestionItem) => {
    if (triggerStartIndex === -1) return;

    const before = value.substring(0, triggerStartIndex);
    const after = value.substring(cursorPosition);

    let replacement = '';

    if (suggestion.type === 'user') {
      // Create enhanced mention format: @[username|userId|filterType]
      const username = suggestion.displayName || suggestion.value;
      const userId = suggestion.value; // The value is the user ID

      // Clean username (remove @ if present)
      const cleanUsername = username.startsWith('@')
        ? username.substring(1)
        : username;

      // Create enhanced mention with default filter type: @[username|userId|author]
      replacement = `@[${cleanUsername}|${userId}|author] `;
    } else if (suggestion.type === 'hashtag') {
      // Handle hashtags normally
      let hashtagValue = suggestion.value;
      if (hashtagValue.startsWith('#')) {
        hashtagValue = hashtagValue.substring(1);
      }
      replacement = `#${hashtagValue} `;
    } else {
      // Fallback for other types
      replacement = `${currentTrigger}${suggestion.value} `;
    }

    const newValue = before + replacement + after;
    const newCursorPosition = before.length + replacement.length;

    onChange(newValue);

    // Focus and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
      }
    }, 0);

    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setHasMore(false);
    setTotalResults(0);
  };

  // Handle clicking on suggestions
  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    insertSuggestion(suggestion);
  };

  // Handle scroll to load more
  const handleSuggestionScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Load more when scrolled to bottom
    if (
      scrollHeight - scrollTop <= clientHeight + 10 &&
      hasMore &&
      !isLoading
    ) {
      loadMore();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionListRef.current &&
        !suggestionListRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const InputComponent = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="inline-suggestion-container">
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleInputChange}
        onPaste={onPaste}
        onSelect={handleCursorPositionChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`inline-suggestion-input ${
          showSuggestions && suggestions.length > 0
            ? 'inline-suggestion-input--with-suggestions'
            : ''
        } ${className}`}
        disabled={disabled}
        rows={as === 'textarea' ? rows : undefined}
      />

      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionListRef}
          className="suggestion-list"
          onScroll={handleSuggestionScroll}
        >
          {/* Results header */}
          {totalResults > 0 && (
            <div className="suggestion-header">
              <span className="suggestion-count">
                {suggestions.length} of {totalResults} results
                {currentQuery && ` for "${currentQuery}"`}
              </span>
            </div>
          )}

          {/* Suggestion items */}
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.type === 'user' && suggestion.avatar && (
                <img
                  src={suggestion.avatar}
                  alt=""
                  className="suggestion-avatar"
                />
              )}
              <span className="suggestion-trigger">
                {suggestion.type === 'hashtag' ? '#' : '@'}
              </span>
              <span className="suggestion-label">{suggestion.label}</span>
            </div>
          ))}

          {/* Load more button */}
          {hasMore && !isLoading && (
            <div className="suggestion-load-more">
              <button
                type="button"
                onClick={loadMore}
                className="suggestion-load-more-btn"
              >
                Load More ({totalResults - suggestions.length} remaining)
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="suggestion-loading">
              <div className="suggestion-loading-spinner"></div>
              <span>Loading more results...</span>
            </div>
          )}

          {/* No results message */}
          {!isLoading && suggestions.length === 0 && currentQuery && (
            <div className="suggestion-no-results">
              No {currentTrigger === '@' ? 'users' : 'hashtags'} found for{' '}
              {`"${currentQuery}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
