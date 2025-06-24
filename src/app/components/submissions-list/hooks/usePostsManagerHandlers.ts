'use client';

import { useAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { shouldUpdateAtom } from '../../../../lib/state/atoms';
import { PostFilters } from '../../../../lib/types/filters';

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
  setIncludeThreadReplies: (value: boolean) => void;
  onNewPostClick?: () => void;
}

export function usePostsManagerHandlers({
  addFilter,
  addFilters,
  removeFilter,
  setIncludeThreadReplies,
  onNewPostClick
}: PostsManagerHandlersOptions): PostsManagerHandlers {
  const [, setShouldUpdate] = useAtom(shouldUpdateAtom);

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
      addFilters(filterList);
    },
    [addFilters]
  );

  // Optimize callbacks with useCallback to prevent child re-renders
  const handleTagClick = useCallback(
    (tag: string) => {
      // Ensure consistent formatting with # prefix to match handleHashtagClick
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      addFilter({ name: 'tags', value: formattedTag });
    },
    [addFilter]
  );

  const handleHashtagClick = useCallback(
    (hashtag: string) => {
      // Ensure hashtag has # prefix for consistency with other components
      const formattedHashtag = hashtag.startsWith('#')
        ? hashtag
        : `#${hashtag}`;
      addFilter({ name: 'tags', value: formattedHashtag });
    },
    [addFilter]
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
    // Trigger a refresh using the shouldUpdateAtom mechanism
    setShouldUpdate(true);
  }, [setShouldUpdate]);

  const handleFilterSuccess = useCallback(() => {
    // This callback is triggered when filters are successfully added
    // Can be used for additional logic if needed
  }, []);

  const handleUpdateFilter = useCallback(
    (name: string, value: string) => {
      // Add or update a filter with the new value
      addFilterRef.current({ name: name as any, value });
    },
    [] // Empty dependency array for stable reference
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
