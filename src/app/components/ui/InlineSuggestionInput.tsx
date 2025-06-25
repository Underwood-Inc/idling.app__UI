'use client';

import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import './InlineSuggestionInput.css';

export interface SuggestionItem {
  id: string;
  value: string; // For users, this is the author_id
  label: string;
  displayName?: string; // For users, this is the author name for display
  avatar?: string;
  type: 'hashtag' | 'user';
  disabled?: boolean; // Whether this option is already selected and should be disabled
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
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 100,
    left: 100,
    width: 300
  });

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionListRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position based on input position
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    // Calculate initial position
    let top = inputRect.bottom + scrollY + 2; // Add small gap
    let left = inputRect.left + scrollX;
    const width = Math.max(inputRect.width, 300); // Minimum width for readability

    // Check if dropdown would go off-screen vertically
    const dropdownHeight = 300; // Max height from CSS
    if (inputRect.bottom + dropdownHeight > viewportHeight) {
      // Position above the input instead
      top = inputRect.top + scrollY - dropdownHeight - 2;
    }

    // Check if dropdown would go off-screen horizontally
    if (left + width > viewportWidth) {
      // Align to right edge of viewport
      left = viewportWidth - width - 10;
    }

    // Ensure dropdown doesn't go off left edge
    if (left < 10) {
      left = 10;
    }

    // Ensure all values are valid numbers
    const finalTop = isNaN(top) ? 100 : Math.max(10, top);
    const finalLeft = isNaN(left) ? 100 : Math.max(10, left);
    const finalWidth = isNaN(width) ? 300 : Math.max(200, width);

    setDropdownPosition({
      top: finalTop,
      left: finalLeft,
      width: finalWidth
    });
  };

  // Update dropdown position when suggestions show/hide or on scroll/resize
  useEffect(() => {
    if (showSuggestions) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        calculateDropdownPosition();
      });

      const handlePositionUpdate = () => {
        requestAnimationFrame(() => {
          calculateDropdownPosition();
        });
      };

      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);

      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [showSuggestions]);

  // Recalculate position when suggestions change
  useEffect(() => {
    if (showSuggestions && suggestions.length > 0) {
      requestAnimationFrame(() => {
        calculateDropdownPosition();
      });
    }
  }, [suggestions.length, showSuggestions]);

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
      // Check if we're inside or after a complete structured mention @[username|userId|author]
      const textFromTrigger = text.substring(lastTriggerIndex);
      const completeStructuredMention = textFromTrigger.match(/^@\[[^\]]+\]/);

      if (completeStructuredMention) {
        const mentionEnd =
          lastTriggerIndex + completeStructuredMention[0].length;

        // If cursor is inside the structured mention or right after it (including space), don't trigger
        if (position <= mentionEnd + 1) {
          // +1 to account for space after mention
          return { trigger: null, query: '', startIndex: -1 };
        }
      }

      // Check if we have a partial structured mention that's not complete
      const partialStructuredMention = textFromTrigger.match(/^@\[[^\]]*$/);
      if (partialStructuredMention) {
        // We're in the middle of typing a structured mention, don't trigger search
        return { trigger: null, query: '', startIndex: -1 };
      }

      // For @ mentions, allow spaces in the query until we hit certain terminating characters
      const terminatingChars = /[.,!?;:\n\r\t]/;
      if (terminatingChars.test(afterTrigger)) {
        return { trigger: null, query: '', startIndex: -1 };
      }

      // Only trigger if we have a simple @ followed by text (not structured format)
      if (afterTrigger.includes('[')) {
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
        // Set selected index to first non-disabled item
        let firstEnabledIndex = -1;
        for (let i = 0; i < result.items.length; i++) {
          if (!result.items[i].disabled) {
            firstEnabledIndex = i;
            break;
          }
        }
        setSelectedIndex(firstEnabledIndex);
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

    // eslint-disable-next-line no-console
    console.log('InlineSuggestionInput handleInputChange:', {
      oldValue: value,
      newValue,
      hasNewlines: newValue.includes('\n'),
      cursorPosition: newCursorPosition
    });

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
    // Debug logging for Enter key
    if (e.key === 'Enter') {
      // eslint-disable-next-line no-console
      console.log('InlineSuggestionInput handleKeyDown Enter pressed:', {
        showSuggestions,
        suggestionsLength: suggestions.length,
        selectedIndex,
        as,
        willReturn: !showSuggestions || suggestions.length === 0
      });
    }

    // Only handle special keys when suggestions are visible
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (selectedIndex < suggestions.length - 1) {
          let nextIndex = selectedIndex + 1;
          // Skip disabled items
          while (
            nextIndex < suggestions.length &&
            suggestions[nextIndex]?.disabled
          ) {
            nextIndex++;
          }
          if (nextIndex < suggestions.length) {
            setSelectedIndex(nextIndex);
          } else if (hasMore && !isLoading) {
            // Load more when reaching the end
            loadMore();
          } else {
            // Wrap to beginning, finding first non-disabled item
            let wrapIndex = 0;
            while (
              wrapIndex < suggestions.length &&
              suggestions[wrapIndex]?.disabled
            ) {
              wrapIndex++;
            }
            if (wrapIndex < suggestions.length) {
              setSelectedIndex(wrapIndex);
            }
          }
        } else if (hasMore && !isLoading) {
          // Load more when reaching the end
          loadMore();
        } else {
          // Wrap to beginning, finding first non-disabled item
          let wrapIndex = 0;
          while (
            wrapIndex < suggestions.length &&
            suggestions[wrapIndex]?.disabled
          ) {
            wrapIndex++;
          }
          if (wrapIndex < suggestions.length) {
            setSelectedIndex(wrapIndex);
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (selectedIndex > 0) {
          let prevIndex = selectedIndex - 1;
          // Skip disabled items
          while (prevIndex >= 0 && suggestions[prevIndex]?.disabled) {
            prevIndex--;
          }
          if (prevIndex >= 0) {
            setSelectedIndex(prevIndex);
          } else {
            // Wrap to end, finding last non-disabled item
            let wrapIndex = suggestions.length - 1;
            while (wrapIndex >= 0 && suggestions[wrapIndex]?.disabled) {
              wrapIndex--;
            }
            if (wrapIndex >= 0) {
              setSelectedIndex(wrapIndex);
            }
          }
        } else {
          // Wrap to end, finding last non-disabled item
          let wrapIndex = suggestions.length - 1;
          while (wrapIndex >= 0 && suggestions[wrapIndex]?.disabled) {
            wrapIndex--;
          }
          if (wrapIndex >= 0) {
            setSelectedIndex(wrapIndex);
          }
        }
        break;
      case 'Enter':
      case 'Tab':
        // Only handle Enter/Tab if a suggestion is actually selected and not disabled
        if (
          selectedIndex >= 0 &&
          selectedIndex < suggestions.length &&
          !suggestions[selectedIndex]?.disabled
        ) {
          e.preventDefault();
          e.stopPropagation();
          insertSuggestion(suggestions[selectedIndex]);
          return; // Prevent any further processing
        }
        // If no suggestion is selected or it's disabled, allow normal Enter/Tab behavior
        // by NOT preventing default - this allows newlines in textarea
        break;
      case 'Escape':
        e.preventDefault();
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

    // Clear suggestions immediately to prevent re-triggering
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setHasMore(false);
    setTotalResults(0);
    setCurrentTrigger(null);
    setCurrentQuery('');

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
  };

  // Handle clicking on suggestions
  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    // Don't allow selecting disabled suggestions
    if (suggestion.disabled) {
      return;
    }
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
      const target = event.target as Node;

      // Check if click is inside input
      if (inputRef.current && inputRef.current.contains(target)) {
        return;
      }

      // Check if click is inside suggestion list
      if (
        suggestionListRef.current &&
        suggestionListRef.current.contains(target)
      ) {
        return;
      }

      // Check if click is inside any portal container (for nested portals)
      const portalContainer = document.querySelector(
        '.suggestion-portal-container'
      );
      if (portalContainer && portalContainer.contains(target)) {
        return;
      }

      // Click is outside, close suggestions
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const InputComponent = as === 'textarea' ? 'textarea' : 'input';

  // Render suggestions dropdown
  const renderSuggestionsDropdown = () => {
    if (!showSuggestions || (!suggestions.length && !isLoading)) return null;

    return (
      <div
        className="suggestion-portal-container"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
      >
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
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''} ${suggestion.disabled ? 'disabled' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              title={suggestion.disabled ? 'Already selected' : undefined}
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
              {suggestion.disabled && (
                <span className="suggestion-disabled-indicator">✓</span>
              )}
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
      </div>
    );
  };

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

      {/* Render suggestions dropdown as portal */}
      {typeof window !== 'undefined' &&
        createPortal(renderSuggestionsDropdown(), document.body)}
    </div>
  );
};
