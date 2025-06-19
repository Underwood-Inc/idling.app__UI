'use client';

import React from 'react';
import {
  PaginatedHashtagResult,
  PaginatedUserResult,
  searchHashtags,
  searchUsers
} from '../../../lib/actions/search.actions';
import {
  InlineSuggestionInput,
  InlineSuggestionInputProps,
  SuggestionItem
} from './InlineSuggestionInput';

export interface SmartInputProps
  extends Omit<InlineSuggestionInputProps, 'onHashtagSearch' | 'onUserSearch'> {
  enableHashtags?: boolean;
  enableUserMentions?: boolean;
  existingHashtags?: string[]; // Hashtags to exclude from search results
  existingUserIds?: string[]; // User IDs to exclude from search results
}

export const SmartInput: React.FC<SmartInputProps> = ({
  enableHashtags = true,
  enableUserMentions = true,
  existingHashtags = [],
  existingUserIds = [],
  ...props
}) => {
  // Enhanced hashtag search function with pagination
  const handleHashtagSearch = async (
    query: string,
    page: number = 1
  ): Promise<{ items: SuggestionItem[]; hasMore: boolean; total: number }> => {
    if (!enableHashtags) {
      return { items: [], hasMore: false, total: 0 };
    }

    try {
      const result: PaginatedHashtagResult = await searchHashtags(query, page);
      const filteredResults = result.items
        .filter((hashtagResult) => {
          // Exclude hashtags that are already added
          const hashtagValue = hashtagResult.value.startsWith('#')
            ? hashtagResult.value
            : `#${hashtagResult.value}`;
          return !existingHashtags.includes(hashtagValue);
        })
        .map((hashtagResult) => ({
          id: hashtagResult.id,
          value: hashtagResult.value,
          label: hashtagResult.label,
          type: 'hashtag' as const
        }));

      return {
        items: filteredResults,
        hasMore: result.hasMore,
        total: result.total
      };
    } catch (error) {
      console.error('Error searching hashtags:', error);
      return { items: [], hasMore: false, total: 0 };
    }
  };

  // Enhanced user search function with pagination
  const handleUserSearch = async (
    query: string,
    page: number = 1
  ): Promise<{ items: SuggestionItem[]; hasMore: boolean; total: number }> => {
    if (!enableUserMentions) {
      return { items: [], hasMore: false, total: 0 };
    }

    try {
      const result: PaginatedUserResult = await searchUsers(query, page);
      const filteredResults = result.items
        .filter((userResult) => {
          // Exclude users that are already added (by user ID)
          return !existingUserIds.includes(userResult.value);
        })
        .map((userResult) => ({
          id: userResult.id,
          value: userResult.value, // author_id for filtering
          label: userResult.label,
          displayName: userResult.displayName, // author name for display
          avatar: userResult.avatar,
          type: 'user' as const
        }));

      return {
        items: filteredResults,
        hasMore: result.hasMore,
        total: result.total
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return { items: [], hasMore: false, total: 0 };
    }
  };

  return (
    <InlineSuggestionInput
      {...props}
      onHashtagSearch={enableHashtags ? handleHashtagSearch : undefined}
      onUserSearch={enableUserMentions ? handleUserSearch : undefined}
    />
  );
};

// Export both components for flexibility
export { InlineSuggestionInput };
export type { InlineSuggestionInputProps, SuggestionItem };
