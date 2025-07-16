'use client';

import { createLogger } from '@lib/logging';
import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
import { PostFilters } from '@lib/types/filters';
import { handleTagFilter } from '@lib/utils/filter-utils';
import React, { useCallback, useRef } from 'react';

const logger = createLogger({ context: { module: 'usePostsManagerHandlers' } });

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
  const {
    filters,
    updateFilter: urlUpdateFilter,
    addFilter: urlAddFilter,
    removeFilter: urlRemoveFilter
  } = useSimpleUrlFilters();

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
      // Use shared handleTagFilter utility for consistency with URL-first functions
      handleTagFilter(tag, filters, urlAddFilter, urlRemoveFilter);
    },
    [urlAddFilter, urlRemoveFilter, filters]
  );

  const handleHashtagClick = useCallback(
    (hashtag: string) => {
      // Use shared handleTagFilter utility for consistency with URL-first functions
      handleTagFilter(hashtag, filters, urlAddFilter, urlRemoveFilter);
    },
    [urlAddFilter, urlRemoveFilter, filters]
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
