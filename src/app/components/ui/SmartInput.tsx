'use client';

import React from 'react';
import {
  HashtagResult,
  searchHashtags,
  searchUsers,
  UserResult
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
  // Default hashtag search function
  const handleHashtagSearch = async (
    query: string
  ): Promise<SuggestionItem[]> => {
    if (!enableHashtags) return [];

    try {
      const results = await searchHashtags(query);
      return results
        .filter((result: HashtagResult) => {
          // Exclude hashtags that are already added
          const hashtagValue = result.value.startsWith('#')
            ? result.value
            : `#${result.value}`;
          return !existingHashtags.includes(hashtagValue);
        })
        .map((result: HashtagResult) => ({
          id: result.id,
          value: result.value,
          label: result.label,
          type: 'hashtag' as const
        }));
    } catch (error) {
      console.error('Error searching hashtags:', error);
      return [];
    }
  };

  // Default user search function
  const handleUserSearch = async (query: string): Promise<SuggestionItem[]> => {
    if (!enableUserMentions) return [];

    try {
      const results = await searchUsers(query);
      return results
        .filter((result: UserResult) => {
          // Exclude users that are already added (by user ID)
          return !existingUserIds.includes(result.value);
        })
        .map((result: UserResult) => ({
          id: result.id,
          value: result.value, // author_id for filtering
          label: result.label,
          displayName: result.displayName, // author name for display
          avatar: result.avatar,
          type: 'user' as const
        }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
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
