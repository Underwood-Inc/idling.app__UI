'use client';

import { createLogger } from '@/lib/logging';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, getSubmissionsFiltersAtom } from '../../../../lib/state/atoms';
import { PostFilters } from '../../../../lib/types/filters';
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
          '../../../../lib/actions/search.actions'
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
  // Read filter state from Jotai
  const [filtersState] = useAtom(getSubmissionsFiltersAtom(contextId));

  // User resolution hook
  const { resolveUserId } = useUserResolution();

  // Construct input value from current filter state
  const constructedValue = useMemo(() => {
    const filterParts: string[] = [];

    // Add tag filters as hashtags (each tag is now a separate filter entry)
    filtersState.filters
      .filter((f: Filter) => f.name === 'tags')
      .forEach((f: Filter) => {
        if (typeof f.value === 'string') {
          const tag = f.value.trim();
          if (tag && !tag.startsWith('#')) {
            filterParts.push(`#${tag}`);
          } else if (tag) {
            filterParts.push(tag);
          }
        }
      });

    // Add author filters as mentions (with async username resolution)
    filtersState.filters
      .filter((f: Filter) => f.name === 'author')
      .forEach((f: Filter) => {
        // Author filters now only store user ID, so we need to resolve username
        // Use the user ID as placeholder, will be resolved below
        filterParts.push(`@[${f.value}|${f.value}|author]`);
      });

    // Add mentions filters
    filtersState.filters
      .filter((f: Filter) => f.name === 'mentions')
      .forEach((f: Filter) => {
        // Check if the value contains both username and user ID (username|userId format)
        if (f.value.includes('|')) {
          const [username, userId] = f.value.split('|');
          filterParts.push(`@[${username}|${userId}|mentions]`);
        } else {
          // Legacy format - just username, use username for both
          filterParts.push(`@[${f.value}|${f.value}|mentions]`);
        }
      });

    // Add search text at the end, ensuring proper spacing
    const searchFilter = filtersState.filters.find(
      (f: Filter) => f.name === 'search'
    );
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
      filters: filtersState.filters,
      filterParts,
      result
    });
    return result;
  }, [filtersState.filters]);

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
  const handleInputChange = useCallback(
    (value: string) => {
      // Parse filters from the input
      const filters: Filter<PostFilters>[] = [];
      const filtersToRemove: { name: PostFilters; value?: any }[] = [];
      let remainingText = value;

      // Extract hashtags
      const hashtagRegex = /#(\w+)/g;
      const hashtags: string[] = [];
      let hashtagMatch;
      while ((hashtagMatch = hashtagRegex.exec(value)) !== null) {
        hashtags.push(hashtagMatch[1]);
        remainingText = remainingText.replace(hashtagMatch[0], '').trim();
      }

      if (hashtags.length > 0) {
        // Remove existing tags filter
        filtersToRemove.push({ name: 'tags' });
        // Add individual tag filter entries (new system)
        hashtags.forEach((tag) => {
          filters.push({
            name: 'tags',
            value: `#${tag}`
          });
        });
      } else {
        // No hashtags found, remove tags filter
        filtersToRemove.push({ name: 'tags' });
      }

      // Extract user mentions
      const mentionRegex = /@\[([^|]+)\|([^|]+)\|([^|]+)\]/g;
      let mentionMatch;
      const processedUsers = new Set<string>();

      while ((mentionMatch = mentionRegex.exec(value)) !== null) {
        const [fullMatch, username, userId, filterType] = mentionMatch;
        const userKey = `${userId}-${filterType}`;

        if (!processedUsers.has(userKey)) {
          processedUsers.add(userKey);

          // Remove existing filters for this user (using both possible formats)
          filtersToRemove.push({ name: 'author', value: userId });
          filtersToRemove.push({
            name: 'author',
            value: `${username}|${userId}`
          });
          filtersToRemove.push({ name: 'mentions', value: username });
          filtersToRemove.push({
            name: 'mentions',
            value: `${username}|${userId}`
          });

          // Add new filter with appropriate format based on filter type
          if (filterType === 'author') {
            // For author filters, backend expects just the user ID
            filters.push({
              name: filterType,
              value: userId
            });
          } else if (filterType === 'mentions') {
            // For mentions filters, store combined format for display
            filters.push({
              name: filterType,
              value: `${username}|${userId}`
            });
          }
        }

        remainingText = remainingText.replace(fullMatch, '').trim();
      }

      // Clean up remaining text and reconstruct search terms
      remainingText = remainingText.replace(/\s+/g, ' ').trim();

      // Handle search text - reconstruct from individual terms and quoted phrases
      if (remainingText) {
        // The remaining text may contain individual words and quoted phrases
        // We need to reconstruct them into a single search value
        const searchTerms: string[] = [];
        const searchRegex = /"([^"]+)"|(\S+)/g;
        let match;

        while ((match = searchRegex.exec(remainingText)) !== null) {
          const quotedText = match[1]; // Captured quoted content
          const unquotedText = match[2]; // Captured unquoted content

          if (quotedText) {
            // Quoted phrase - keep the quotes
            searchTerms.push(`"${quotedText}"`);
          } else if (unquotedText) {
            // Individual word
            searchTerms.push(unquotedText);
          }
        }

        if (searchTerms.length > 0) {
          filters.push({ name: 'search', value: searchTerms.join(' ') });
        }
      } else {
        filtersToRemove.push({ name: 'search' });
      }

      // Apply filter changes
      if (filtersToRemove.length > 0 && onRemoveFilter) {
        filtersToRemove.forEach(({ name, value }) => {
          onRemoveFilter(name, value);
        });
      }

      if (filters.length > 0) {
        if (onAddFilters && filters.length > 1) {
          onAddFilters(filters);
        } else if (onAddFilter) {
          filters.forEach((filter) => onAddFilter(filter));
        }

        if (onFilterSuccess) {
          onFilterSuccess();
        }
      }
    },
    [onAddFilter, onAddFilters, onRemoveFilter, onFilterSuccess]
  );

  // Calculate filter category counts for enhanced search status
  const filterCounts = useMemo(() => {
    const counts = {
      tags: 0,
      authors: 0,
      mentions: 0,
      search: 0
    };

    filtersState.filters.forEach((filter: Filter) => {
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
  }, [filtersState.filters]);

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
    [filtersState.filters, onRemoveFilter, onAddFilter, onFilterSuccess]
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
