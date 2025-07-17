import {
  HashtagResult,
  searchHashtags,
  searchUsers,
  UserResult
} from '@lib/actions/search.actions';
import { useEffect, useMemo, useState } from 'react';

export const useFloatingToolbar = (
  existingHashtags: string[] = [],
  existingUserIds: string[] = []
) => {
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingMentions, setLoadingMentions] = useState(false);

  // Create stable string representations for dependency comparison
  const existingHashtagsKey = useMemo(
    () => existingHashtags.sort().join(','),
    [existingHashtags]
  );
  const existingUserIdsKey = useMemo(
    () => existingUserIds.sort().join(','),
    [existingUserIds]
  );

  // Search hashtags using real server action
  useEffect(() => {
    if (hashtagQuery.length >= 2) {
      setLoadingHashtags(true);

      // Use the existing hashtag search server action
      const searchHashtagsAsync = async () => {
        try {
          const result = await searchHashtags(hashtagQuery, 1, 10);

          // Transform the server action response to match expected format and mark disabled
          const transformedResults = result.items.map(
            (hashtag: HashtagResult) => {
              const hashtagValue = hashtag.value.startsWith('#')
                ? hashtag.value
                : `#${hashtag.value}`;
              const isDisabled = existingHashtags.includes(hashtagValue);

              return {
                id: hashtag.id,
                label: hashtag.label,
                value: hashtag.value,
                count: hashtag.count,
                disabled: isDisabled
              };
            }
          );

          setHashtagResults(transformedResults);
        } catch (error) {
          console.warn('Error searching hashtags:', error);
          // Fallback to simple suggestion
          const fallbackValue = hashtagQuery.startsWith('#')
            ? hashtagQuery
            : `#${hashtagQuery}`;
          const isDisabled = existingHashtags.includes(fallbackValue);

          setHashtagResults([
            {
              id: `${hashtagQuery}-1`,
              label: hashtagQuery,
              value: fallbackValue,
              count: 0,
              disabled: isDisabled
            }
          ]);
        } finally {
          setLoadingHashtags(false);
        }
      };

      const timeoutId = setTimeout(searchHashtagsAsync, 300); // Debounce
      return () => {
        clearTimeout(timeoutId);
        // Ensure loading state is cleared if component unmounts or query changes
        setLoadingHashtags(false);
      };
    } else {
      setHashtagResults([]);
      setLoadingHashtags(false);
    }
  }, [hashtagQuery, existingHashtagsKey, existingHashtags]);

  // Search mentions using real server action
  useEffect(() => {
    if (mentionQuery.length >= 2) {
      setLoadingMentions(true);

      // Use the existing user search server action
      const searchUsersAsync = async () => {
        try {
          const result = await searchUsers(mentionQuery, 1, 10);

          // Transform the server action response to match expected format and mark disabled
          const transformedResults = result.items.map((user: UserResult) => {
            const isDisabled = existingUserIds.includes(user.value);

            return {
              id: user.id,
              label: user.label,
              value: user.value,
              displayName: user.displayName,
              avatar: user.avatar,
              isAuthor: false,
              disabled: isDisabled
            };
          });

          setMentionResults(transformedResults);
        } catch (error) {
          console.warn('Error searching users:', error);
          // Fallback to simple suggestion
          const fallbackValue = `${mentionQuery}-id`;
          const isDisabled = existingUserIds.includes(fallbackValue);

          setMentionResults([
            {
              id: `${mentionQuery}-user`,
              label: `${mentionQuery}`,
              value: fallbackValue,
              displayName: `${mentionQuery}`,
              avatar: null,
              isAuthor: false,
              disabled: isDisabled
            }
          ]);
        } finally {
          setLoadingMentions(false);
        }
      };

      const timeoutId = setTimeout(searchUsersAsync, 300); // Debounce
      return () => {
        clearTimeout(timeoutId);
        // Ensure loading state is cleared if component unmounts or query changes
        setLoadingMentions(false);
      };
    } else {
      setMentionResults([]);
      setLoadingMentions(false);
    }
  }, [mentionQuery, existingUserIdsKey, existingUserIds]);

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
