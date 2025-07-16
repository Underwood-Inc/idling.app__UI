'use client';

import { createLogger } from '@lib/logging';
import { Filter } from '@lib/state/atoms';
import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { PostFilters } from '@lib/types/filters';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TextSearchInput } from './TextSearchInput';

const logger = createLogger({
  context: {
    component: 'SmartTextSearchInput',
    module: 'submissions-list'
  }
});

// Hook for resolving user IDs to usernames (same as FilterLabel)
const useUserResolution = () => {
  const [userCache, setUserCache] = useState<Map<string, string>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

  const resolveUserId = useCallback(
    async (userId: string): Promise<string> => {
      // Return cached result if available
      if (userCache.has(userId)) {
        return userCache.get(userId)!;
      }

      // Return userId if already loading
      if (loadingUsers.has(userId)) {
        return userId;
      }

      // Check if this looks like a user ID that needs resolution (numeric or UUID-like)
      const isUserIdFormat = (value: string) => {
        return (
          /^\d+$/.test(value) || // Numeric ID
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value
          )
        ); // UUID
      };

      if (!isUserIdFormat(userId)) {
        // Not a user ID format, return as-is
        return userId;
      }

      // Start loading
      setLoadingUsers((prev) => new Set(prev).add(userId));

      try {
        const { resolveUserIdToUsername } = await import(
          '@lib/actions/search.actions'
        );
        const username = await resolveUserIdToUsername(userId);

        if (username) {
          // Cache the result
          setUserCache((prev) => new Map(prev).set(userId, username));
          return username;
        } else {
          // Cache the failure (use userId as fallback)
          setUserCache((prev) => new Map(prev).set(userId, userId));
          return userId;
        }
      } catch (error) {
        console.error('Error resolving user ID to username:', error);
        // Cache the failure (use userId as fallback)
        setUserCache((prev) => new Map(prev).set(userId, userId));
        return userId;
      } finally {
        // Stop loading
        setLoadingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    },
    [userCache, loadingUsers]
  );

  return {
    resolveUserId,
    isLoading: (userId: string) => loadingUsers.has(userId)
  };
};

export interface SmartTextSearchInputProps {
  onSearch: (searchText: string) => void;
  onAddFilter?: (filter: Filter<PostFilters>) => void;
  onAddFilters?: (filters: Filter<PostFilters>[]) => void;
  onRemoveFilter?: (name: PostFilters, value?: any) => void;
  onFilterSuccess?: () => void;
  onClearFilters?: () => void;
  contextId: string; // Required for filter state management
  placeholder?: string;
  minLength?: number;
  className?: string;
  // Combined replies filter
  showRepliesFilter?: boolean;
  includeThreadReplies?: boolean;
  onlyReplies?: boolean;
  onToggleThreadReplies?: (checked: boolean) => void;
  onToggleOnlyReplies?: (checked: boolean) => void;
  isLoading?: boolean;
}

export const SmartTextSearchInput: React.FC<SmartTextSearchInputProps> = ({
  onSearch,
  onAddFilter,
  onAddFilters,
  onRemoveFilter,
  onFilterSuccess,
  onClearFilters,
  contextId,
  placeholder = 'Search posts content... (or use @user #tag for filters)',
  minLength = 2,
  className = '',
  showRepliesFilter = false,
  includeThreadReplies = false,
  onlyReplies = false,
  onToggleThreadReplies,
  onToggleOnlyReplies,
  isLoading = false
}) => {
  // Use the new URL-first filter system instead of Jotai atoms
  const { filters } = useSimpleUrlFilters();

  // User resolution hook
  const { resolveUserId } = useUserResolution();

  // Construct input value from current filter state
  const constructedValue = useMemo(() => {
    const filterParts: string[] = [];

    // Add hashtags
    filters
      .filter((f) => f.name === 'tags')
      .forEach((filter) => {
        const cleanValue = filter.value.startsWith('#')
          ? filter.value
          : `#${filter.value}`;
        filterParts.push(cleanValue);
      });

    // Add structured mentions and authors
    filters
      .filter((f) => f.name === 'author' || f.name === 'mentions')
      .forEach((filter) => {
        if (filter.value.includes('|')) {
          const [username, userId] = filter.value.split('|');
          const filterType = filter.name === 'author' ? 'author' : 'mentions';
          filterParts.push(`@[${username}|${userId}|${filterType}]`);
        } else {
          const filterType = filter.name === 'author' ? 'author' : 'mentions';
          filterParts.push(`@[${filter.value}|${filter.value}|${filterType}]`);
        }
      });

    // Add search text and handle quoted phrases
    const searchFilter = filters.find((f) => f.name === 'search');
    if (searchFilter?.value) {
      // Parse search text to identify quoted phrases and individual words
      const searchText = searchFilter.value;
      const searchParts: string[] = [];

      // Regex to match quoted phrases and individual words
      const searchRegex = /"([^"]+)"|(\S+)/g;
      let match;

      while ((match = searchRegex.exec(searchText)) !== null) {
        const quotedText = match[1]; // Captured quoted content
        const unquotedText = match[2]; // Captured unquoted content

        if (quotedText) {
          // Quoted phrase - treat as atomic pill
          searchParts.push(`"${quotedText}"`);
        } else if (unquotedText) {
          // Individual word
          searchParts.push(unquotedText);
        }
      }

      // Add search parts to filterParts
      if (searchParts.length > 0) {
        // Ensure search text is separated from pills with a space
        if (filterParts.length > 0) {
          filterParts.push(''); // This will create a space when joined
        }
        filterParts.push(...searchParts);
      }
    }

    const result = filterParts.join(' ').replace(/\s+/g, ' ').trim();
    logger.debug('SmartTextSearchInput constructedValue', {
      filters: filters,
      filterParts,
      result
    });
    return result;
  }, [filters]);

  // Resolve usernames for legacy user ID filters
  const [resolvedValue, setResolvedValue] = useState(constructedValue);

  useEffect(() => {
    const resolveUsernames = async () => {
      let updatedValue = constructedValue;

      // Find all user ID-only mentions that need resolution
      const userIdOnlyRegex = /@\[(\d+)\|(\d+)\|(author|mentions)\]/g;
      const matches = [...constructedValue.matchAll(userIdOnlyRegex)];

      for (const match of matches) {
        const [fullMatch, displayUserId, filterUserId, filterType] = match;

        // Only resolve if display and filter user IDs are the same (indicating legacy format)
        if (displayUserId === filterUserId) {
          try {
            const username = await resolveUserId(displayUserId);
            if (username !== displayUserId) {
              // Replace with resolved username
              const resolvedMention = `@[${username}|${filterUserId}|${filterType}]`;
              updatedValue = updatedValue.replace(fullMatch, resolvedMention);
            }
          } catch (error) {
            logger.error(
              'Failed to resolve username for user ID',
              error as Error,
              {
                userId: displayUserId
              }
            );
          }
        }
      }

      if (updatedValue !== resolvedValue) {
        setResolvedValue(updatedValue);
      }
    };

    resolveUsernames();
  }, [constructedValue, resolveUserId, resolvedValue]);

  // Handle input value changes and parse filters
  const handleInputChange = useCallback((value: string) => {
    // Just update the input value, don't apply filters yet
    // Filters will be applied on Enter key or blur
  }, []);

  // Parse filters from input text
  const parseInputToFilters = useCallback(
    (value: string) => {
      // Parse filters from the input
      let remainingText = value;

      // Extract hashtags
      const hashtagRegex = /#(\w+)/g;
      const hashtags: string[] = [];
      let hashtagMatch;
      while ((hashtagMatch = hashtagRegex.exec(value)) !== null) {
        hashtags.push(hashtagMatch[1]);
        remainingText = remainingText.replace(hashtagMatch[0], '').trim();
      }

      const filtersToApply: any[] = [];

      if (hashtags.length > 0) {
        // Remove existing tags filter
        if (onRemoveFilter) {
          onRemoveFilter('tags');
        }
        // Add individual tag filter entries (new system)
        hashtags.forEach((tag) => {
          filtersToApply.push({
            name: 'tags',
            value: tag
          });
        });
      }

      // Extract user mentions @[username|userId|filterType]
      const mentionRegex = /@\[([^|]+)\|([^|]+)\|([^|]+)\]/g;
      let mentionMatch;
      while ((mentionMatch = mentionRegex.exec(value)) !== null) {
        const [fullMatch, username, userId, filterType] = mentionMatch;
        remainingText = remainingText.replace(fullMatch, '').trim();

        // Remove existing filters for this user (using both possible formats)
        if (onRemoveFilter) {
          onRemoveFilter('author', userId);
          onRemoveFilter('author', `${username}|${userId}`);
          onRemoveFilter('mentions', username);
          onRemoveFilter('mentions', `${username}|${userId}`);
        }

        // Add new filter with appropriate format based on filter type
        if (filterType === 'author') {
          // For author filters, backend expects just the user ID
          filtersToApply.push({
            name: 'author',
            value: userId
          });
        } else if (filterType === 'mentions') {
          // For mentions filters, store combined format for display
          filtersToApply.push({
            name: 'mentions',
            value: `${username}|${userId}`
          });
        }
      }

      // Handle remaining text as search
      if (remainingText.trim().length >= minLength) {
        const searchTerms = remainingText.trim().split(/\s+/);

        if (searchTerms.length > 0) {
          filtersToApply.push({ name: 'search', value: searchTerms.join(' ') });
        }
      } else if (onRemoveFilter) {
        onRemoveFilter('search');
      }

      // Apply all filters at once
      if (filtersToApply.length > 0 && onAddFilters) {
        onAddFilters(filtersToApply);
      } else if (filtersToApply.length > 0 && onAddFilter) {
        filtersToApply.forEach((filter) => onAddFilter(filter));
      }

      if (onFilterSuccess) {
        onFilterSuccess();
      }
    },
    [onAddFilter, onAddFilters, onRemoveFilter, onFilterSuccess, minLength]
  );

  // Handle Enter key to apply filters
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Parse and apply filters on Enter
        parseInputToFilters(resolvedValue);
      }
    },
    [parseInputToFilters, resolvedValue]
  );

  // Handle blur to apply filters when user clicks away
  const handleBlur = useCallback(() => {
    // Parse and apply filters on blur
    parseInputToFilters(resolvedValue);
  }, [parseInputToFilters, resolvedValue]);

  // Calculate filter category counts for enhanced search status
  const filterCounts = useMemo(() => {
    const counts = {
      tags: 0,
      authors: 0,
      mentions: 0,
      search: 0
    };

    filters.forEach((filter) => {
      switch (filter.name) {
        case 'tags':
          // Count individual tag filter entries (new system)
          counts.tags++;
          break;
        case 'author':
          counts.authors++;
          break;
        case 'mentions':
          counts.mentions++;
          break;
        case 'search':
          if (filter.value) {
            // Count space-separated search terms
            counts.search = filter.value
              .trim()
              .split(/\s+/)
              .filter((term) => term.length >= 2).length;
          }
          break;
      }
    });

    return counts;
  }, [filters]);

  // Calculate total active filters
  const totalActiveFilters =
    filterCounts.tags +
    filterCounts.authors +
    filterCounts.mentions +
    (filterCounts.search > 0 ? 1 : 0);

  // Handle mention clicks for filter type changes
  const handleMentionClick = useCallback(
    (mention: string, filterType?: 'author' | 'mentions') => {
      if (!filterType || !onAddFilter || !onRemoveFilter) return;

      // Parse the mention to get user info
      const enhancedMatch = mention.match(
        /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
      );
      if (!enhancedMatch) return;

      const [, username, userId] = enhancedMatch;

      // Remove existing filters for this user (using both possible formats)
      onRemoveFilter('author', userId);
      onRemoveFilter('author', `${username}|${userId}`);
      onRemoveFilter('mentions', username);
      onRemoveFilter('mentions', `${username}|${userId}`);

      // Add new filter with appropriate format based on filter type
      if (filterType === 'author') {
        // For author filters, backend expects just the user ID
        onAddFilter({
          name: filterType,
          value: userId
        });
      } else if (filterType === 'mentions') {
        // For mentions filters, store combined format for display
        onAddFilter({
          name: filterType,
          value: `${username}|${userId}`
        });
      }

      if (onFilterSuccess) {
        onFilterSuccess();
      }

      logger.debug('Mention filter type changed', {
        username,
        userId,
        newFilterType: filterType,
        filterValue: `${username}|${userId}`
      });
    },
    [onAddFilter, onRemoveFilter, onFilterSuccess]
  );

  // Handle pill clicks for removal
  const handlePillClick = useCallback(
    (pillText: string) => {
      if (!onRemoveFilter) return;

      // Parse the pill to determine what filter to remove
      if (pillText.startsWith('#')) {
        // Remove specific tag filter entry (new system)
        const tag = pillText.substring(1);
        // Remove the specific tag filter entry by its exact value
        onRemoveFilter('tags', `#${tag}`);
      } else if (pillText.startsWith('@')) {
        // Parse mention format to determine removal
        const enhancedMatch = pillText.match(
          /^@\[([^|]+)\|([^|]+)\|([^|]+)\]$/
        );
        if (enhancedMatch) {
          const [, username, userId, filterType] = enhancedMatch;
          if (filterType === 'author') {
            // For author filters, remove by user ID only
            onRemoveFilter('author', userId);
          } else if (filterType === 'mentions') {
            // For mentions filters, remove by combined format
            onRemoveFilter('mentions', `${username}|${userId}`);
          }
        }
      }

      if (onFilterSuccess) {
        onFilterSuccess();
      }
    },
    [filters, onRemoveFilter, onAddFilter, onFilterSuccess]
  );

  return (
    <TextSearchInput
      onSearch={onSearch}
      contextId={contextId}
      placeholder={placeholder}
      minLength={minLength}
      className={className}
      value={resolvedValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      showRepliesFilter={showRepliesFilter}
      includeThreadReplies={includeThreadReplies}
      onlyReplies={onlyReplies}
      onToggleThreadReplies={onToggleThreadReplies}
      onToggleOnlyReplies={onToggleOnlyReplies}
      isLoading={isLoading}
      enableSmartInput={true}
      onMentionClick={handleMentionClick}
      onPillClick={handlePillClick}
      onAddFilter={onAddFilter}
      onAddFilters={onAddFilters}
      onRemoveFilter={onRemoveFilter}
      onFilterSuccess={onFilterSuccess}
      onClearFilters={onClearFilters}
      // Enhanced filter information
      filterCounts={filterCounts}
      totalActiveFilters={totalActiveFilters}
    />
  );
};
