import { useEffect, useState } from 'react';

export const useFloatingToolbar = () => {
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingMentions, setLoadingMentions] = useState(false);

  // Search hashtags
  useEffect(() => {
    if (hashtagQuery.length >= 2) {
      setLoadingHashtags(true);
      // Simulate API call with timeout
      const timeout = setTimeout(() => {
        const mockResults = [
          { id: 1, label: hashtagQuery, value: hashtagQuery },
          { id: 2, label: `${hashtagQuery}dev`, value: `${hashtagQuery}dev` },
          { id: 3, label: `${hashtagQuery}test`, value: `${hashtagQuery}test` }
        ];
        setHashtagResults(mockResults);
        setLoadingHashtags(false);
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setHashtagResults([]);
      setLoadingHashtags(false);
    }
  }, [hashtagQuery]);

  // Search mentions
  useEffect(() => {
    if (mentionQuery.length >= 2) {
      setLoadingMentions(true);
      // Simulate API call with timeout
      const timeout = setTimeout(() => {
        const mockResults = [
          {
            id: 1,
            label: `${mentionQuery}user`,
            value: 1,
            displayName: `${mentionQuery}user`,
            avatar: null
          },
          {
            id: 2,
            label: `${mentionQuery}admin`,
            value: 2,
            displayName: `${mentionQuery}admin`,
            avatar: null
          }
        ];
        setMentionResults(mockResults);
        setLoadingMentions(false);
      }, 300);
      return () => clearTimeout(timeout);
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
