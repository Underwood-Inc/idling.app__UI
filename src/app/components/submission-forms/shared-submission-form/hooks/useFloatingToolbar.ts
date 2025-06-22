import { useEffect, useState } from 'react';
import {
  HashtagResult,
  searchHashtags,
  searchUsers,
  UserResult
} from '../../../../../lib/actions/search.actions';

export const useFloatingToolbar = () => {
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingMentions, setLoadingMentions] = useState(false);

  // Search hashtags using real server action
  useEffect(() => {
    if (hashtagQuery.length >= 2) {
      setLoadingHashtags(true);

      // Use the existing hashtag search server action
      const searchHashtagsAsync = async () => {
        try {
          const result = await searchHashtags(hashtagQuery, 1, 10);

          // Transform the server action response to match expected format
          const transformedResults = result.items.map(
            (hashtag: HashtagResult) => ({
              id: hashtag.id,
              label: hashtag.label,
              value: hashtag.value,
              count: hashtag.count
            })
          );

          setHashtagResults(transformedResults);
        } catch (error) {
          console.warn('Error searching hashtags:', error);
          // Fallback to simple suggestion
          setHashtagResults([
            {
              id: `${hashtagQuery}-1`,
              label: hashtagQuery,
              value: hashtagQuery.startsWith('#')
                ? hashtagQuery
                : `#${hashtagQuery}`,
              count: 0
            }
          ]);
        } finally {
          setLoadingHashtags(false);
        }
      };

      const timeoutId = setTimeout(searchHashtagsAsync, 300); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setHashtagResults([]);
      setLoadingHashtags(false);
    }
  }, [hashtagQuery]);

  // Search mentions using real server action
  useEffect(() => {
    if (mentionQuery.length >= 2) {
      setLoadingMentions(true);

      // Use the existing user search server action
      const searchUsersAsync = async () => {
        try {
          const result = await searchUsers(mentionQuery, 1, 10);

          // Transform the server action response to match expected format
          const transformedResults = result.items.map((user: UserResult) => ({
            id: user.id,
            label: user.label,
            value: user.value,
            displayName: user.displayName,
            avatar: user.avatar,
            isAuthor: false
          }));

          setMentionResults(transformedResults);
        } catch (error) {
          console.warn('Error searching users:', error);
          // Fallback to simple suggestion
          setMentionResults([
            {
              id: `${mentionQuery}-user`,
              label: `${mentionQuery}`,
              value: `${mentionQuery}-id`,
              displayName: `${mentionQuery}`,
              avatar: null,
              isAuthor: false
            }
          ]);
        } finally {
          setLoadingMentions(false);
        }
      };

      const timeoutId = setTimeout(searchUsersAsync, 300); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setMentionResults([]);
      setLoadingMentions(false);
    }
  }, [mentionQuery]);

  return {
    hashtagQuery,
    setHashtagQuery,
    mentionQuery,
    setMentionQuery,
    hashtagResults,
    mentionResults,
    loadingHashtags,
    loadingMentions
  };
};
