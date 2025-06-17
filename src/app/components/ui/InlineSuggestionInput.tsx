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
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onHashtagSearch?: (query: string) => Promise<SuggestionItem[]>;
  onUserSearch?: (query: string) => Promise<SuggestionItem[]>;
  maxSuggestions?: number;
  minQueryLength?: number;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const InlineSuggestionInput: React.FC<InlineSuggestionInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  onHashtagSearch,
  onUserSearch,
  maxSuggestions = 5,
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

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionListRef = useRef<HTMLDivElement>(null);

  // Detect trigger characters and extract query
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

    // Check if there's a space after the trigger, which would invalidate the query
    if (afterTrigger.includes(' ')) {
      return { trigger: null, query: '', startIndex: -1 };
    }

    return {
      trigger,
      query: afterTrigger,
      startIndex: lastTriggerIndex
    };
  };

  // Search for suggestions
  const searchSuggestions = async (trigger: '#' | '@', query: string) => {
    if (query.length < minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      let results: SuggestionItem[] = [];

      if (trigger === '#' && onHashtagSearch) {
        results = await onHashtagSearch(query);
      } else if (trigger === '@' && onUserSearch) {
        results = await onUserSearch(query);
      }

      setSuggestions(results.slice(0, maxSuggestions));
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input change
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    const { trigger, query } = detectTriggerAndQuery(
      newValue,
      newCursorPosition
    );

    setCurrentTrigger(trigger);
    setCurrentQuery(query);

    if (trigger && query !== currentQuery) {
      searchSuggestions(trigger, query);
    } else if (!trigger) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle cursor position changes
  const handleCursorPositionChange = (
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const newCursorPosition = target.selectionStart || 0;
    setCursorPosition(newCursorPosition);

    const { trigger, query } = detectTriggerAndQuery(value, newCursorPosition);

    setCurrentTrigger(trigger);
    setCurrentQuery(query);

    if (!trigger) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
  };

  // Insert selected suggestion
  const insertSuggestion = (suggestion: SuggestionItem) => {
    const { trigger, query, startIndex } = detectTriggerAndQuery(
      value,
      cursorPosition
    );

    if (trigger && startIndex !== -1) {
      const before = value.substring(0, startIndex);
      const after = value.substring(startIndex + 1 + query.length);

      let replacement = '';

      if (suggestion.type === 'user') {
        // Create robust mention format: @[username|userId]
        const username = suggestion.displayName || suggestion.value;
        const userId = suggestion.value; // The value is the user ID

        // Clean username (remove @ if present)
        const cleanUsername = username.startsWith('@')
          ? username.substring(1)
          : username;

        // Create robust mention: @[username|userId]
        replacement = `@[${cleanUsername}|${userId}] `;
      } else if (suggestion.type === 'hashtag') {
        // Handle hashtags normally
        let hashtagValue = suggestion.value;
        if (hashtagValue.startsWith('#')) {
          hashtagValue = hashtagValue.substring(1);
        }
        replacement = `#${hashtagValue} `;
      } else {
        // Fallback for other types
        replacement = `${trigger}${suggestion.value} `;
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
    }

    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle clicking on suggestions
  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    insertSuggestion(suggestion);
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

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionListRef} className="suggestion-list">
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
        </div>
      )}
    </div>
  );
};
