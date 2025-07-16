'use client';

import { createLogger } from '@lib/logging';
import { Filter } from '@lib/state/atoms';
import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { PostFilters } from '@lib/types/filters';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RichInputAdapter } from '../../submission-forms/shared-submission-form/components/RichInputAdapter';
import './SmartFilterInput.css';

const logger = createLogger({
  context: {
    component: 'SmartFilterInput',
    module: 'submissions-list'
  }
});

interface SmartFilterInputProps {
  placeholder?: string;
  className?: string;
  contextId: string;
  enableHashtags?: boolean;
  enableUserMentions?: boolean;
  onMentionClick?: (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => void;
  onPillClick?: (pill: string) => void;
  onAddFilter?: (filter: Filter<PostFilters>) => void;
  onAddFilters?: (filters: Filter<PostFilters>[]) => void;
  onRemoveFilter?: (name: PostFilters, value?: any) => void;
  onFilterSuccess?: () => void;
  onSearch?: (searchText: string) => void;
  onClearFilters?: () => void;
  onValueChange?: (value: string) => void;
}

export const SmartFilterInput: React.FC<SmartFilterInputProps> = ({
  placeholder = 'Search posts, #hashtags, @mentions...',
  className = '',
  contextId,
  enableHashtags = true,
  enableUserMentions = true,
  onAddFilter,
  onAddFilters,
  onRemoveFilter,
  onFilterSuccess,
  onSearch,
  onClearFilters,
  onValueChange
}) => {
  // Use the new URL-first filter system instead of Jotai atoms
  const { filters } = useSimpleUrlFilters();

  // Local input state for user typing
  const [localInputValue, setLocalInputValue] = useState('');
  const [isUpdatingFromFilters, setIsUpdatingFromFilters] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [lastFilterStateLength, setLastFilterStateLength] = useState(0);
  const [lastInputValue, setLastInputValue] = useState('');

  // Convert current filter state to display value
  const filtersToDisplayValue = useMemo(() => {
    const parts: string[] = [];

    // Add hashtags
    filters
      .filter((f) => f.name === 'tags')
      .forEach((filter) => {
        const cleanValue = filter.value.startsWith('#')
          ? filter.value
          : `#${filter.value}`;
        parts.push(cleanValue);
      });

    // Add structured mentions and authors
    filters
      .filter((f) => f.name === 'author' || f.name === 'mentions')
      .forEach((filter) => {
        if (filter.value.includes('|')) {
          const [username, userId] = filter.value.split('|');
          const filterType = filter.name === 'author' ? 'author' : 'mentions';
          parts.push(`@[${username}|${userId}|${filterType}]`);
        } else {
          const filterType = filter.name === 'author' ? 'author' : 'mentions';
          parts.push(`@[${filter.value}|${filter.value}|${filterType}]`);
        }
      });

    // Add search text
    const searchFilter = filters.find((f) => f.name === 'search');
    if (searchFilter?.value) {
      const searchText = searchFilter.value;
      // Parse quoted phrases and individual words
      const quotedRegex = /"([^"]+)"/g;
      const searchParts: string[] = [];

      const remainingText = searchText.replace(quotedRegex, (match, quoted) => {
        searchParts.push(`"${quoted}"`);
        return '';
      });

      // Add remaining individual words
      const words = remainingText.trim().split(/\s+/).filter(Boolean);
      searchParts.push(...words);
      parts.push(...searchParts);
    }

    return parts.join(' ');
  }, [filters]);

  // Initialize input value on first load
  useEffect(() => {
    if (localInputValue === '' && filtersToDisplayValue !== '') {
      setLocalInputValue(filtersToDisplayValue);
    }
  }, []);

  // Sync input with filter state changes
  useEffect(() => {
    const currentFilterCount = filters.length;

    // If filters were cleared (went from having filters to no filters)
    if (lastFilterStateLength > 0 && currentFilterCount === 0) {
      setLocalInputValue('');
      setIsUserTyping(false);
    }
    // If filters were added and user is not currently typing, update the input to show constructed value
    else if (
      currentFilterCount > 0 &&
      !isUserTyping &&
      filtersToDisplayValue !== localInputValue
    ) {
      setLocalInputValue(filtersToDisplayValue);
      setIsUserTyping(false);
    }

    setLastFilterStateLength(currentFilterCount);
  }, [
    filters.length,
    lastFilterStateLength,
    isUserTyping,
    isUpdatingFromFilters,
    filtersToDisplayValue,
    localInputValue
  ]);

  // Reset the updating flag when the display value has been applied
  useEffect(() => {
    if (isUpdatingFromFilters && localInputValue === filtersToDisplayValue) {
      setIsUpdatingFromFilters(false);
    }
  }, [isUpdatingFromFilters, localInputValue, filtersToDisplayValue]);

  // Reset user typing flag when input matches filter state
  useEffect(() => {
    if (isUserTyping && localInputValue === filtersToDisplayValue) {
      setIsUserTyping(false);
    }
  }, [isUserTyping, localInputValue, filtersToDisplayValue]);

  // Notify parent of value changes for clear button visibility
  useEffect(() => {
    if (onValueChange) {
      onValueChange(localInputValue);
    }
  }, [localInputValue, onValueChange]);

  // Parse user input and extract filters
  const parseInputToFilters = useCallback(
    (input: string): Filter<PostFilters>[] => {
      const parsedFilters: Filter<PostFilters>[] = [];
      let remainingText = input;

      // Extract hashtags
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(input)) !== null) {
        parsedFilters.push({ name: 'tags', value: match[1] });
        remainingText = remainingText.replace(match[0], '').trim();
      }

      // Extract structured mentions @[username|userId|filterType]
      const mentionRegex = /@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]/g;
      while ((match = mentionRegex.exec(input)) !== null) {
        const [fullMatch, username, userId, filterType] = match;
        if (filterType === 'author') {
          parsedFilters.push({ name: 'author', value: userId });
        } else if (filterType === 'mentions') {
          parsedFilters.push({
            name: 'mentions',
            value: `${username}|${userId}`
          });
        } else {
          parsedFilters.push({
            name: 'mentions',
            value: `${username}|${userId}`
          });
        }
        remainingText = remainingText.replace(fullMatch, '').trim();
      }

      // Extract simple mentions @username
      const simpleMentionRegex = /@(\w+)/g;
      while ((match = simpleMentionRegex.exec(remainingText)) !== null) {
        parsedFilters.push({ name: 'mentions', value: match[1] });
        remainingText = remainingText.replace(match[0], '').trim();
      }

      // Handle remaining text as search
      if (remainingText.trim()) {
        parsedFilters.push({ name: 'search', value: remainingText.trim() });
      }

      return parsedFilters;
    },
    []
  );

  // Apply filters to state
  const applyFilters = useCallback(
    (filtersToApply: Filter<PostFilters>[]) => {
      setIsUpdatingFromFilters(true);

      // Clear existing filters
      if (onRemoveFilter) {
        onRemoveFilter('tags');
        onRemoveFilter('author');
        onRemoveFilter('mentions');
        onRemoveFilter('search');
      }

      // Add new filters
      if (filtersToApply.length > 0) {
        if (onAddFilters) {
          onAddFilters(filtersToApply);
        } else if (onAddFilter) {
          filtersToApply.forEach((filter) => onAddFilter(filter));
        }
        if (onFilterSuccess) {
          onFilterSuccess();
        }
      }

      // Trigger search callback if there's search text
      const searchFilter = filtersToApply.find((f) => f.name === 'search');
      if (searchFilter && onSearch) {
        onSearch(searchFilter.value);
      }
    },
    [onRemoveFilter, onAddFilters, onAddFilter, onFilterSuccess, onSearch]
  );

  // Handle input changes from RichInputAdapter (only update local state)
  const handleInputChange = useCallback(
    (newValue: string) => {
      // Prevent infinite loops during programmatic updates
      if (isUpdatingFromFilters) {
        return;
      }

      // Check if this is a search result selection (contains structured mentions or hashtags with spaces)
      const wasStructuredInsert =
        newValue !== lastInputValue &&
        // Check for hashtag insertions ending with space
        (/#\w+\s$/.test(newValue) ||
          // Check for structured mention insertions ending with space
          /@\[[^|\]]+\|[^|\]]+\|[^|\]]+\]\s$/.test(newValue));

      // Always update local state immediately for responsive typing
      setLocalInputValue(newValue);

      // If this was a search result selection, apply filters immediately
      if (wasStructuredInsert) {
        const filters = parseInputToFilters(newValue);
        applyFilters(filters);
        setIsUserTyping(false);

        // Try immediate cursor positioning (might work if DOM updates synchronously)
        const immediatePosition = () => {
          const activeElement = document.activeElement as HTMLInputElement;
          if (
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
              activeElement.tagName === 'TEXTAREA')
          ) {
            const length = activeElement.value.length;
            activeElement.setSelectionRange(length, length);
            // eslint-disable-next-line no-console
            console.log('🎯 Immediate cursor positioning to:', length);
            return true;
          }
          return false;
        };

        // Try immediate positioning first
        const immediateSuccess = immediatePosition();

        // Set cursor to end after filter application completes
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log(
            '🎯 SmartFilterInput: Starting cursor positioning after filter application'
          );

          // Try multiple approaches to find and focus the input
          let inputElement: HTMLInputElement | HTMLTextAreaElement | null =
            null;

          // Try to find the RichInput's actual input element
          const richInputContainer = document.querySelector(
            '.smart-filter-input__rich-input'
          );
          if (richInputContainer) {
            inputElement = richInputContainer.querySelector(
              'input, textarea, [contenteditable="true"]'
            ) as HTMLInputElement;
            // eslint-disable-next-line no-console
            console.log(
              '🎯 Found input via rich input container:',
              inputElement
            );
          }

          // Fallback to any focused input in the smart filter container
          if (!inputElement) {
            const smartFilterContainer = document.querySelector(
              '.smart-filter-input'
            );
            if (smartFilterContainer) {
              inputElement = smartFilterContainer.querySelector(
                'input, textarea, [contenteditable="true"]'
              ) as HTMLInputElement;
              // eslint-disable-next-line no-console
              console.log(
                '🎯 Found input via smart filter container:',
                inputElement
              );
            }
          }

          // Final fallback to the currently focused element if it's an input
          if (!inputElement) {
            const activeElement = document.activeElement;
            if (
              activeElement &&
              (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.getAttribute('contenteditable') === 'true')
            ) {
              inputElement = activeElement as HTMLInputElement;
              // eslint-disable-next-line no-console
              console.log('🎯 Found input via active element:', inputElement);
            }
          }

          if (inputElement) {
            // eslint-disable-next-line no-console
            console.log(
              '🎯 Current input value:',
              (inputElement as HTMLInputElement).value
            );
            // eslint-disable-next-line no-console
            console.log(
              '🎯 Current cursor position:',
              (inputElement as HTMLInputElement).selectionStart
            );

            // Focus first
            inputElement.focus();

            // Set cursor to end
            if (
              inputElement.tagName === 'INPUT' ||
              inputElement.tagName === 'TEXTAREA'
            ) {
              const length = (inputElement as HTMLInputElement).value.length;
              (inputElement as HTMLInputElement).setSelectionRange(
                length,
                length
              );
              // eslint-disable-next-line no-console
              console.log('🎯 Set cursor to position:', length);
            } else if (
              inputElement.getAttribute('contenteditable') === 'true'
            ) {
              // For contenteditable elements, use Selection API
              const range = document.createRange();
              range.selectNodeContents(inputElement);
              range.collapse(false); // Collapse to end
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
              // eslint-disable-next-line no-console
              console.log('🎯 Set cursor to end of contenteditable');
            }
          } else {
            // eslint-disable-next-line no-console
            console.log('❌ No input element found for cursor positioning');
          }
        }, 200); // Increased timeout even more to ensure everything has settled
      } else {
        // Mark that user is actively typing for manual input
        setIsUserTyping(true);
      }

      // Update the last input value for comparison in next call
      setLastInputValue(newValue);
    },
    [isUpdatingFromFilters, lastInputValue, parseInputToFilters, applyFilters]
  );

  // Handle Enter key to apply filters
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isUpdatingFromFilters) {
        e.preventDefault();
        // Parse and apply filters on Enter
        const filters = parseInputToFilters(localInputValue);
        applyFilters(filters);
        // User finished typing
        setIsUserTyping(false);
      }
    },
    [parseInputToFilters, applyFilters, isUpdatingFromFilters, localInputValue]
  );

  // Handle blur to apply filters when user clicks away
  const handleBlur = useCallback(() => {
    if (isUpdatingFromFilters) {
      return;
    }

    // Parse and apply filters on blur
    const filters = parseInputToFilters(localInputValue);
    applyFilters(filters);
    // User finished typing
    setIsUserTyping(false);
  }, [
    parseInputToFilters,
    applyFilters,
    isUpdatingFromFilters,
    localInputValue
  ]);

  return (
    <div
      className={`smart-filter-input ${className}`}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <RichInputAdapter
        value={localInputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        contextId={`${contextId}-filter`}
        className="smart-filter-input__rich-input"
        multiline={false}
        enableHashtags={enableHashtags}
        enableUserMentions={enableUserMentions}
        enableEmojis={false}
        enableImagePaste={false}
        mentionFilterType="mentions"
        enableDebugLogging={false}
      />
    </div>
  );
};
