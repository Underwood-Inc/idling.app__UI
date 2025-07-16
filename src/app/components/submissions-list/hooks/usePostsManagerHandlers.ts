'use client';

import { createLogger } from '@lib/logging';
import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { PostFilters } from '@lib/types/filters';
import React, { useCallback, useRef } from 'react';

const logger = createLogger({
  context: {
    component: 'usePostsManagerHandlers',
    module: 'hooks'
  },
  enabled: true
});

export interface PostsManagerHandlers {
  handleAddFilter: (filter: any) => void;
  handleAddFilters: (filterList: any[]) => void;
  handleTagClick: (tag: string) => void;
  handleHashtagClick: (hashtag: string) => void;
  handleMentionClick: (
    mention: string,
    filterType: 'author' | 'mentions'
  ) => void;
  handleToggleThreadReplies: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNewPostClick: () => void;
  handleRefresh: () => void;
  handleFilterSuccess: () => void;
  handleUpdateFilter: (name: string, value: string) => void;
  handleTextSearch: (searchText: string) => void;
}

export interface PostsManagerHandlersOptions {
  addFilter: (filter: any) => void;
  addFilters: (filters: any[]) => void;
  removeFilter: (filterName: PostFilters, filterValue?: string) => void;
  updateFilter: (filterName: PostFilters, newValue: string) => void;
  setIncludeThreadReplies: (value: boolean) => void;
  onNewPostClick?: () => void;
  contextId: string; // Add contextId to access filters from atom
}

export function usePostsManagerHandlers({
  addFilter,
  addFilters,
  removeFilter,
  updateFilter,
  setIncludeThreadReplies,
  onNewPostClick,
  contextId
}: PostsManagerHandlersOptions): PostsManagerHandlers {
  // Use the new URL-first filter system instead of Jotai atoms
  const { filters, updateFilter: urlUpdateFilter } = useSimpleUrlFilters();

  // Use refs for stable function references
  const addFilterRef = useRef(addFilter);
  addFilterRef.current = addFilter;

  // Filter handlers without automatic expansion
  const handleAddFilter = useCallback(
    (filter: any) => {
      addFilter(filter);
    },
    [addFilter]
  );

  const handleAddFilters = useCallback(
    (filterList: any[]) => {
      logger.debug('[RACE_FIX] ➕ ADD_FILTERS: Adding filters', { filterList });
      addFilters(filterList);
    },
    [addFilters]
  );

  // Optimize callbacks with useCallback to prevent child re-renders
  const handleTagClick = useCallback(
    (tag: string) => {
      // Store tags without # prefix to match URL format and prevent normalization conflicts
      const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;

      // Get current filters from the new URL-first system
      const existingTagFilters = filters.filter((f) => f.name === 'tags');
      const willHaveMultipleTags = existingTagFilters.length >= 1; // Will have multiple after adding this one

      // Debug logging
      logger.debug('[RACE_FIX] 🏷️ TAG_CLICK: Tag click handler called', {
        tag,
        normalizedTag,
        existingTagFilters,
        willHaveMultipleTags,
        currentFiltersLength: filters.length
      });

      // Prepare filters to add
      const filtersToAdd = [{ name: 'tags', value: normalizedTag }];

      // Add tagLogic if we'll have multiple tags
      if (willHaveMultipleTags) {
        filtersToAdd.push({ name: 'tagLogic', value: 'OR' });
      }

      logger.debug('[RACE_FIX] 🏷️ TAG_CLICK: Filters to add', { filtersToAdd });

      // Add all filters atomically to prevent double fetches
      addFilters(filtersToAdd);
    },
    [addFilters, filters] // Include filters in dependencies now
  );

  const handleHashtagClick = useCallback(
    (hashtag: string) => {
      // Store tags without # prefix to match URL format and prevent normalization conflicts
      const normalizedHashtag = hashtag.startsWith('#')
        ? hashtag.slice(1)
        : hashtag;

      // Get current filters from the new URL-first system
      const existingTagFilters = filters.filter((f) => f.name === 'tags');
      const willHaveMultipleTags = existingTagFilters.length >= 1; // Will have multiple after adding this one

      // Prepare filters to add
      const filtersToAdd = [{ name: 'tags', value: normalizedHashtag }];

      // Add tagLogic if we'll have multiple tags
      if (willHaveMultipleTags) {
        filtersToAdd.push({ name: 'tagLogic', value: 'OR' });
      }

      // Add all filters atomically to prevent double fetches
      addFilters(filtersToAdd);
    },
    [addFilters, filters] // Include filters in dependencies now
  );

  const handleMentionClick = useCallback(
    (mention: string, filterType: 'author' | 'mentions') => {
      addFilter({
        name: filterType,
        value: mention.replace('@', '')
      });
    },
    [addFilter]
  );

  const handleToggleThreadReplies = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIncludeThreadReplies(e.target.checked);
    },
    [setIncludeThreadReplies]
  );

  const handleNewPostClick = useCallback(() => {
    if (onNewPostClick) {
      onNewPostClick();
    }
  }, [onNewPostClick]);

  const handleRefresh = useCallback(() => {
    // Trigger a refresh by clearing and re-adding filters to force re-fetch
    const currentFilters = [...filters];
    // This will trigger a re-fetch in the useSubmissionsManager
    if (currentFilters.length > 0) {
      addFilters(currentFilters);
    }
  }, [filters, addFilters]);

  const handleFilterSuccess = useCallback(() => {
    // This callback is triggered when filters are successfully added
    // Can be used for additional logic if needed
  }, []);

  const handleUpdateFilter = useCallback(
    (name: string, value: string) => {
      // Use the URL-first updateFilter instead of the old system
      urlUpdateFilter(name, value);
    },
    [urlUpdateFilter] // Use URL-first system instead of old updateFilter
  );

  const handleTextSearch = useCallback(
    (searchText: string) => {
      // Remove existing search filter first
      removeFilter('search' as PostFilters);

      // Add new search filter if text is provided
      if (searchText.trim().length > 0) {
        addFilter({ name: 'search', value: searchText.trim() });
      }
    },
    [addFilter, removeFilter]
  );

  return {
    handleAddFilter,
    handleAddFilters,
    handleTagClick,
    handleHashtagClick,
    handleMentionClick,
    handleToggleThreadReplies,
    handleNewPostClick,
    handleRefresh,
    handleFilterSuccess,
    handleUpdateFilter,
    handleTextSearch
  };
}
