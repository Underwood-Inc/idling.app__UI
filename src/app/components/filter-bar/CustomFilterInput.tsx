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
  onAddFilters?: (filters: Filter<PostFilters>[]) => void;
  onFilterSuccess?: () => void;
  placeholder?: string;
  className?: string;
}

export function CustomFilterInput({
  contextId,
  onAddFilter,
  onAddFilters,
  onFilterSuccess,
  placeholder = 'Add filter: @user or #tag...',
  className = ''
}: CustomFilterInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [currentEditValue, setCurrentEditValue] = useState('');
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
    const filtersToAdd: Filter<PostFilters>[] = [];

    pills.forEach((pill) => {
      if (pill.type === 'hashtag') {
        const filter = createHashtagFilter(pill.content);
        if (filter) filtersToAdd.push(filter);
      } else if (pill.type === 'mention') {
        const filter = createUserFilter(pill.content);
        if (filter) filtersToAdd.push(filter);
      }
    });

    // Use batched addition if available and we have multiple filters
    if (onAddFilters && filtersToAdd.length > 1) {
      onAddFilters(filtersToAdd);
    } else {
      // Fall back to individual addition
      filtersToAdd.forEach((filter) => onAddFilter(filter));
    }

    // Clear the input after processing with a small delay to ensure state updates complete
    setTimeout(() => {
      setInputValue('');
      setCurrentEditValue('');
      setFilterType('tags'); // Reset to default
    }, 0);

    if (onFilterSuccess) {
      onFilterSuccess();
    }
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

  const createHashtagFilter = (value: string): Filter<PostFilters> | null => {
    // Clean the hashtag value
    let cleanValue = value.replace(/^#+/, ''); // Remove leading #'s
    if (!cleanValue) return null;

    // Ensure it starts with # for consistency
    const hashtagValue = `#${cleanValue}`;

    // Return tags filter
    return {
      name: 'tags',
      value: hashtagValue
    };
  };

  const createUserFilter = (value: string): Filter<PostFilters> | null => {
    // Handle different mention formats:
    // @username
    // @[username|userId] (legacy from SmartInput)
    // @[username|userId|filterType] (enhanced with filter type)

    let userId = '';
    let username = '';
    let filterType: 'author' | 'mentions' = userFilterMode; // Default to current mode

    // Check if it's in the enhanced format @[username|userId|filterType]
    const enhancedMatch = value.match(/^@\[([^|]+)\|([^|]+)\|([^|]+)\]$/);
    if (enhancedMatch) {
      username = enhancedMatch[1];
      userId = enhancedMatch[2];
      filterType = enhancedMatch[3] as 'author' | 'mentions';
    } else {
      // Check if it's in the legacy structured format @[username|userId]
      const structuredMatch = value.match(/^@\[([^|]+)\|([^\]]+)\]$/);
      if (structuredMatch) {
        username = structuredMatch[1];
        userId = structuredMatch[2];
        // Use the current user filter mode for legacy format
      } else {
        // Simple @username format
        username = value.replace(/^@+/, ''); // Remove leading @'s
        if (!username) return null;

        // Validate username format (alphanumeric, underscore, hyphen)
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
          console.warn('Invalid username format:', username);
          return null;
        }

        // For simple format, we'll use the username as both username and userId
        // The backend will handle username resolution
        userId = username;
      }
    }

    // Create filter based on the determined filter type
    const filterName: PostFilters = filterType;
    const filterValue = filterType === 'author' ? userId : username;

    return {
      name: filterName,
      value: filterValue
    };
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

  // Handle input changes from SmartPillInput
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
      // Remove the pill from both values - let SmartPillInput handle its own removal
      // We just need to clear our local state
      setCurrentEditValue('');
      // Don't modify inputValue here - let SmartPillInput handle it
    }
  };

  const handleMentionClick = (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => {
    // Handle enhanced mention format with embedded filter type
    const enhancedMatch = mention.match(/^@\[([^|]+)\|([^|]+)\|([^|]+)\]$/);
    if (enhancedMatch) {
      const [, username, userId, embeddedFilterType] = enhancedMatch;
      // Use the embedded filter type if no explicit type provided
      const selectedFilterType =
        filterType || (embeddedFilterType as 'author' | 'mentions') || 'author';

      // Create and add the appropriate filter
      const filter = createUserFilterWithType(
        `@[${username}|${userId}]`,
        selectedFilterType
      );
      if (filter) {
        onAddFilter(filter);

        // Clear input after successful addition
        setTimeout(() => {
          setInputValue('');
          setCurrentEditValue('');
          setFilterType('tags'); // Reset to default
        }, 0);

        if (onFilterSuccess) {
          onFilterSuccess();
        }
      }
      return;
    }

    // Default to 'author' if no filter type is specified
    const selectedFilterType = filterType || 'author';

    // Update the user filter mode based on the selected filter type
    setUserFilterMode(selectedFilterType);

    // Create and add the appropriate filter
    const filter = createUserFilterWithType(mention, selectedFilterType);
    if (filter) {
      onAddFilter(filter);

      // Clear input after successful addition
      setTimeout(() => {
        setInputValue('');
        setCurrentEditValue('');
        setFilterType('tags'); // Reset to default
      }, 0);

      if (onFilterSuccess) {
        onFilterSuccess();
      }
    }
  };

  const createUserFilterWithType = (
    value: string,
    filterType: 'author' | 'mentions'
  ): Filter<PostFilters> | null => {
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
      if (!username) return null;

      // Validate username format (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        console.warn('Invalid username format:', username);
        return null;
      }

      // For simple format, we'll use the username as both username and userId
      // The backend will handle username resolution
      userId = username;
    }

    // Create filter based on specified type
    const filterName: PostFilters = filterType;
    const filterValue = filterType === 'author' ? userId : username;

    return {
      name: filterName,
      value: filterValue
    };
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
              onMentionClick={handleMentionClick}
              placeholder={placeholder}
              className="custom-filter-input__input"
              enableHashtags={true}
              enableUserMentions={true}
              contextId={contextId}
            />
          </div>

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
            'Filtering by user - select from suggestions or use inline controls on pills'}
          {(currentEditValue || inputValue) &&
            !(currentEditValue || inputValue).startsWith('#') &&
            !(currentEditValue || inputValue).startsWith('@') &&
            'Will be treated as hashtag when added'}
        </p>
      </div>
    </div>
  );
}
