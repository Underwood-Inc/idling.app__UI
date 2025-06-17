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
}

export const SmartInput: React.FC<SmartInputProps> = ({
  enableHashtags = true,
  enableUserMentions = true,
  ...props
}) => {
  // Default hashtag search function
  const handleHashtagSearch = async (
    query: string
  ): Promise<SuggestionItem[]> => {
    if (!enableHashtags) return [];

    try {
      const results = await searchHashtags(query);
      return results.map((result: HashtagResult) => ({
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
      return results.map((result: UserResult) => ({
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
