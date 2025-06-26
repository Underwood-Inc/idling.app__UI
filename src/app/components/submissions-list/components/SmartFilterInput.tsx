'use client';

import { createLogger } from '@/lib/logging';
import { useAtom } from 'jotai';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, getSubmissionsFiltersAtom } from '../../../../lib/state/atoms';
import { PostFilters } from '../../../../lib/types/filters';
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
  const [filtersState] = useAtom(getSubmissionsFiltersAtom(contextId));

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
    filtersState.filters
      .filter((f: Filter) => f.name === 'tags')
      .forEach((filter: Filter) => {
        // Handle legacy comma-separated values by splitting them
        const values = filter.value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        values.forEach((value) => {
          const cleanValue = value.startsWith('#') ? value : `#${value}`;
          parts.push(cleanValue);
        });
      });

    // Add structured mentions and authors
    filtersState.filters
      .filter((f: Filter) => f.name === 'author' || f.name === 'mentions')
      .forEach((filter: Filter) => {
        // Handle legacy comma-separated values by splitting them
        const values = filter.value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        values.forEach((value) => {
          if (value.includes('|')) {
            const [username, userId] = value.split('|');
            const filterType = filter.name === 'author' ? 'author' : 'mentions';
            parts.push(`@[${username}|${userId}|${filterType}]`);
          } else {
            const filterType = filter.name === 'author' ? 'author' : 'mentions';
            parts.push(`@[${value}|${value}|${filterType}]`);
          }
        });
      });

    // Add search text
    const searchFilter = filtersState.filters.find(
      (f: Filter) => f.name === 'search'
    );
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
  }, [filtersState.filters]);

  // Initialize input value on first load
  useEffect(() => {
    if (localInputValue === '' && filtersToDisplayValue !== '') {
      setLocalInputValue(filtersToDisplayValue);
    }
  }, []);

  // Sync input with filter state changes
  useEffect(() => {
    const currentFilterCount = filtersState.filters.length;

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
      // eslint-disable-next-line no-console
      console.log('🔍 SYNC: Syncing input with filter state:', {
        currentFilterCount,
        lastFilterStateLength,
        isUserTyping,
        isUpdatingFromFilters,
        filtersToDisplayValue,
        localInputValue,
        willUpdate: true
      });
      setLocalInputValue(filtersToDisplayValue);
      setIsUserTyping(false);
    }

    setLastFilterStateLength(currentFilterCount);
  }, [
    filtersState.filters.length,
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
      const filters: Filter<PostFilters>[] = [];
      let remainingText = input;

      // Extract hashtags
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(input)) !== null) {
        filters.push({ name: 'tags', value: match[1] });
        remainingText = remainingText.replace(match[0], '').trim();
      }

      // Extract structured mentions @[username|userId|filterType]
      const mentionRegex = /@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]/g;
      while ((match = mentionRegex.exec(input)) !== null) {
        const [fullMatch, username, userId, filterType] = match;
        if (filterType === 'author') {
          filters.push({ name: 'author', value: userId });
        } else if (filterType === 'mentions') {
          filters.push({ name: 'mentions', value: `${username}|${userId}` });
        } else {
          filters.push({ name: 'mentions', value: `${username}|${userId}` });
        }
        remainingText = remainingText.replace(fullMatch, '').trim();
      }

      // Extract simple mentions @username
      const simpleMentionRegex = /@(\w+)/g;
      while ((match = simpleMentionRegex.exec(remainingText)) !== null) {
        filters.push({ name: 'mentions', value: match[1] });
        remainingText = remainingText.replace(match[0], '').trim();
      }

      // Handle remaining text as search
      if (remainingText.trim()) {
        filters.push({ name: 'search', value: remainingText.trim() });
      }

      return filters;
    },
    []
  );

  // Apply filters to state
  const applyFilters = useCallback(
    (filters: Filter<PostFilters>[]) => {
      setIsUpdatingFromFilters(true);

      // Clear existing filters
      onRemoveFilter?.('tags');
      onRemoveFilter?.('author');
      onRemoveFilter?.('mentions');
      onRemoveFilter?.('search');

      // Add new filters
      if (filters.length > 0) {
        onAddFilters?.(filters);
        onFilterSuccess?.();
      }

      // Trigger search callback if there's search text
      const searchFilter = filters.find((f) => f.name === 'search');
      if (searchFilter?.value) {
        onSearch?.(searchFilter.value);
      }
    },
    [onAddFilters, onRemoveFilter, onFilterSuccess, onSearch]
  );

  // Handle input changes from RichInputAdapter (only update local state)
  const handleInputChange = useCallback(
    (newValue: string) => {
      // Prevent infinite loops during programmatic updates
      if (isUpdatingFromFilters) {
        return;
      }

      // Add debugging to understand what's happening
      // eslint-disable-next-line no-console
      console.log('🔍 INPUT: handleInputChange called:', {
        newValue,
        localInputValue,
        isUpdatingFromFilters,
        isUserTyping
      });

      // Check if this change adds a complete structured mention or hashtag
      // This indicates a search result selection that should be applied immediately
      const prevValue = lastInputValue; // Use the actual previous input value, not localInputValue

      // Detect if structured content was added (selection from autocomplete)
      const hasStructuredMention = /@\[[^\]]+\]/.test(newValue);
      const prevHadStructuredMention = /@\[[^\]]+\]/.test(prevValue);
      const addedStructuredMention =
        hasStructuredMention && !prevHadStructuredMention;

      // Detect if the change significantly increased the length (likely a selection)
      const lengthIncrease = newValue.length - prevValue.length;
      const significantIncrease = lengthIncrease > 5; // More than just typing a few chars

      // Detect if we went from partial mention to structured mention
      const hadPartialMention = /@\w*$/.test(prevValue.trim());
      const nowHasStructured = /@\[[^\]]+\]/.test(newValue);
      const mentionCompleted = hadPartialMention && nowHasStructured;

      // Also detect if we went from simple mention (@username) to structured mention
      const hadSimpleMention = /@\w+$/.test(prevValue.trim());
      const nowHasStructuredFromSimple =
        hadSimpleMention && hasStructuredMention;
      const mentionUpgraded = nowHasStructuredFromSimple;

      // Also detect hashtag completions
      const hasHashtag = /#\w+\s/.test(newValue);
      const prevHadHashtag = /#\w+\s/.test(prevValue);
      const addedHashtag = hasHashtag && !prevHadHashtag;

      // eslint-disable-next-line no-console
      console.log('🔍 INPUT: Selection analysis:', {
        prevValue,
        newValue,
        addedStructuredMention,
        significantIncrease,
        mentionCompleted,
        mentionUpgraded,
        addedHashtag,
        lengthIncrease
      });

      // Always update local state immediately for responsive typing
      setLocalInputValue(newValue);

      // Mark that user is actively typing (regardless of whether it's a selection or typing)
      setIsUserTyping(true);

      // Always update the last input value for comparison in next call
      setLastInputValue(newValue);
    },
    [isUpdatingFromFilters, lastInputValue]
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
      />
    </div>
  );
};
