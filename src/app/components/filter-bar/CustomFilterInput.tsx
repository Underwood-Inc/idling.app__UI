'use client';

import { useState } from 'react';
import { Filter } from '../../../lib/state/atoms';
import { PostFilters } from '../../../lib/types/filters';
import { SmartPillInput } from '../ui/SmartPillInput';
import './CustomFilterInput.css';

export type FilterType = 'tags' | 'users';
export type UserFilterMode = 'author' | 'mentions';

interface CustomFilterInputProps {
  contextId: string;
  onAddFilter: (filter: Filter<PostFilters>) => void;
  placeholder?: string;
  className?: string;
}

export function CustomFilterInput({
  contextId,
  onAddFilter,
  placeholder = 'Add filter: @user or #tag...',
  className = ''
}: CustomFilterInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [currentEditValue, setCurrentEditValue] = useState(''); // Track edit value from SmartPillInput
  const [filterType, setFilterType] = useState<FilterType>('tags');
  const [userFilterMode, setUserFilterMode] =
    useState<UserFilterMode>('author');

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setCurrentEditValue(value);

    // Auto-detect filter type based on input
    if (value.startsWith('#')) {
      setFilterType('tags');
    } else if (value.startsWith('@')) {
      setFilterType('users');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get the complete value including both existing pills and new input
    const valueToProcess = currentEditValue || inputValue;
    if (!valueToProcess.trim()) return;

    // Process the input and create appropriate filter
    processFilterInput(valueToProcess.trim());
  };

  const processFilterInput = (value: string) => {
    const pills = parseMultiplePills(value);

    pills.forEach((pill) => {
      if (pill.type === 'hashtag') {
        processHashtagFilter(pill.content);
      } else if (pill.type === 'mention') {
        processUserFilter(pill.content);
      }
    });

    // Clear the input after processing with a small delay to ensure state updates complete
    setTimeout(() => {
      setInputValue('');
      setCurrentEditValue('');
      setFilterType('tags'); // Reset to default
    }, 0);
  };

  // Parse input string to extract multiple pills
  const parseMultiplePills = (
    text: string
  ): Array<{ type: 'hashtag' | 'mention'; content: string }> => {
    const pills: Array<{ type: 'hashtag' | 'mention'; content: string }> = [];

    // Simple regex to match:
    // - Hashtags: #word
    // - Valid mentions: @[username|userId]
    // - Malformed mentions: [username|userId] (missing @ prefix - fix these)
    const pillRegex = /#\w+|@\[[^\]]+\]|\[[^\]]+\]/g;
    let match;

    while ((match = pillRegex.exec(text)) !== null) {
      const matchedText = match[0];

      if (matchedText.startsWith('#')) {
        pills.push({
          type: 'hashtag',
          content: matchedText
        });
      } else if (matchedText.startsWith('@[')) {
        // Valid mention format
        pills.push({
          type: 'mention',
          content: matchedText
        });
      } else if (matchedText.startsWith('[') && matchedText.includes('|')) {
        // Malformed mention missing @ prefix - fix it
        pills.push({
          type: 'mention',
          content: `@${matchedText}`
        });
      }
    }

    return pills;
  };

  const processHashtagFilter = (value: string) => {
    // Clean the hashtag value
    let cleanValue = value.replace(/^#+/, ''); // Remove leading #'s
    if (!cleanValue) return;

    // Ensure it starts with # for consistency
    const hashtagValue = `#${cleanValue}`;

    // Add tags filter
    onAddFilter({
      name: 'tags',
      value: hashtagValue
    });
  };

  const processUserFilter = (value: string) => {
    // Handle different mention formats:
    // @username
    // @[username|userId] (from SmartInput)

    let userId = '';
    let username = '';

    // Check if it's in the structured format @[username|userId]
    const structuredMatch = value.match(/^@\[([^|]+)\|([^\]]+)\]$/);
    if (structuredMatch) {
      username = structuredMatch[1];
      userId = structuredMatch[2];
    } else {
      // Simple @username format
      username = value.replace(/^@+/, ''); // Remove leading @'s
      if (!username) return;

      // Validate username format (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        console.warn('Invalid username format:', username);
        return;
      }

      // For simple format, we'll use the username as both username and userId
      // The backend will handle username resolution
      userId = username;
    }

    // Create filter based on selected mode
    const filterName: PostFilters = userFilterMode;
    const filterValue = userFilterMode === 'author' ? userId : username;

    onAddFilter({
      name: filterName,
      value: filterValue
    });
  };

  // Determine current mode for display
  const getCurrentMode = () => {
    const valueToCheck = currentEditValue || inputValue;
    if (valueToCheck.startsWith('#')) {
      return 'hashtag';
    } else if (valueToCheck.startsWith('@')) {
      return userFilterMode;
    }
    return null;
  };

  const currentMode = getCurrentMode();
  const showUserModeSelector =
    filterType === 'users' && (currentEditValue || inputValue).startsWith('@');

  const handleSmartInputChange = (newValue: string) => {
    // Update input value and handle filter type detection
    setInputValue(newValue);
    // Don't set currentEditValue here to avoid circular updates

    // Auto-detect filter type based on input
    if (newValue.startsWith('#')) {
      setFilterType('tags');
    } else if (newValue.startsWith('@')) {
      setFilterType('users');
    }
  };

  const handleEditValueChange = (editValue: string) => {
    setCurrentEditValue(editValue);

    // Don't sync inputValue here to avoid circular updates
    // The SmartPillInput will handle its own state

    // Auto-detect filter type based on edit value
    if (editValue.startsWith('#')) {
      setFilterType('tags');
    } else if (editValue.startsWith('@')) {
      setFilterType('users');
    }
  };

  const handlePillClick = (pillText: string, action: 'edit' | 'remove') => {
    if (action === 'edit') {
      // For incomplete pills, the SmartPillInput will handle entering edit mode
      // We just need to make sure our state is in sync
      setCurrentEditValue(pillText);
      setInputValue(pillText);
    } else if (action === 'remove') {
      // Remove the pill from both values
      const newValue = inputValue
        .replace(pillText, '')
        .replace(/\s+/g, ' ')
        .trim();
      setInputValue(newValue);
      setCurrentEditValue(newValue);
    }
  };

  return (
    <div className={`custom-filter-input ${className}`}>
      <form onSubmit={handleSubmit} className="custom-filter-input__form">
        {/* Smart Pill Input with Mode Indicator */}
        <div className="custom-filter-input__input-container">
          <div className="custom-filter-input__input-wrapper">
            <SmartPillInput
              value={inputValue}
              onChange={handleSmartInputChange}
              onEditValueChange={handleEditValueChange}
              onPillClick={handlePillClick}
              placeholder={placeholder}
              className="custom-filter-input__input"
              enableHashtags={true}
              enableUserMentions={true}
              contextId={contextId}
            />

            {/* Mode Indicator */}
            {currentMode && (
              <div className="custom-filter-input__mode-indicator">
                {currentMode === 'hashtag' && (
                  <span className="custom-filter-input__mode-badge custom-filter-input__mode-badge--hashtag">
                    #Tag
                  </span>
                )}
                {currentMode === 'author' && (
                  <span className="custom-filter-input__mode-badge custom-filter-input__mode-badge--author">
                    @Author
                  </span>
                )}
                {currentMode === 'mentions' && (
                  <span className="custom-filter-input__mode-badge custom-filter-input__mode-badge--mentions">
                    @Mentions
                  </span>
                )}
              </div>
            )}
          </div>

          {/* User Filter Mode Selector - only shown when typing @ */}
          {showUserModeSelector && (
            <div className="custom-filter-input__user-mode">
              <select
                value={userFilterMode}
                onChange={(e) =>
                  setUserFilterMode(e.target.value as UserFilterMode)
                }
                className="custom-filter-input__select"
                title="Choose how to filter by users"
              >
                <option value="author">Posts by user</option>
                <option value="mentions">Posts mentioning user</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="custom-filter-input__submit"
            disabled={!inputValue.trim()}
            title="Add filter"
          >
            Add
          </button>
        </div>
      </form>

      {/* Dynamic Help Text */}
      <div className="custom-filter-input__help">
        <p className="custom-filter-input__help-text">
          {!(currentEditValue || inputValue) &&
            'Type # for hashtags or @ for users...'}
          {(currentEditValue || inputValue).startsWith('#') &&
            'Filtering by hashtag - select from suggestions, add space to complete, or click Add'}
          {(currentEditValue || inputValue).startsWith('@') &&
            `Filtering posts ${userFilterMode === 'author' ? 'by' : 'mentioning'} user - select from suggestions`}
          {(currentEditValue || inputValue) &&
            !(currentEditValue || inputValue).startsWith('#') &&
            !(currentEditValue || inputValue).startsWith('@') &&
            'Will be treated as hashtag when added'}
        </p>
      </div>
    </div>
  );
}
