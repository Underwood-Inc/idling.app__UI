import { emojiParser } from '@lib/utils/parsers/emoji-parser';
import { useCallback, useState } from 'react';
import { useFloatingToolbar } from './useFloatingToolbar';

interface SearchOverlayState {
  visible: boolean;
  type: 'hashtag' | 'mention' | 'emoji' | null;
  query: string;
  triggerIndex: number;
}

interface UseSearchOverlayProps {
  value: string;
  onChange: (value: string) => void;
  existingHashtags: string[];
  existingUserIds: string[];
  mentionFilterType: 'author' | 'mentions';
  enableHashtags: boolean;
  enableUserMentions: boolean;
  enableEmojis: boolean;
}

export function useSearchOverlay({
  value,
  onChange,
  existingHashtags,
  existingUserIds,
  mentionFilterType,
  enableHashtags,
  enableUserMentions,
  enableEmojis
}: UseSearchOverlayProps) {
  const [searchOverlay, setSearchOverlay] = useState<SearchOverlayState>({
    visible: false,
    type: null,
    query: '',
    triggerIndex: -1
  });

  const [emojiResults, setEmojiResults] = useState<any[]>([]);

  // Use existing hooks for hashtag and mention search
  const {
    hashtagQuery: _hashtagQuery,
    setHashtagQuery,
    mentionQuery: _mentionQuery,
    setMentionQuery,
    hashtagResults,
    mentionResults,
    loadingHashtags,
    loadingMentions
  } = useFloatingToolbar(existingHashtags, existingUserIds);

  // Get search results based on overlay type
  const getSearchResults = useCallback(() => {
    if (!searchOverlay.visible || !searchOverlay.type) return [];

    switch (searchOverlay.type) {
      case 'hashtag':
        return hashtagResults;
      case 'mention':
        return mentionResults;
      case 'emoji':
        return emojiResults;
      default:
        return [];
    }
  }, [searchOverlay, hashtagResults, mentionResults, emojiResults]);

  // Check if search is loading
  const isSearchLoading = useCallback(() => {
    if (!searchOverlay.visible || !searchOverlay.type) return false;

    switch (searchOverlay.type) {
      case 'hashtag':
        return loadingHashtags;
      case 'mention':
        return loadingMentions;
      case 'emoji':
        return false; // Emoji search is synchronous
      default:
        return false;
    }
  }, [searchOverlay, loadingHashtags, loadingMentions]);

  // Hide search overlay - defined first to avoid circular dependencies
  const hideSearchOverlay = useCallback(() => {
    setSearchOverlay({
      visible: false,
      type: null,
      query: '',
      triggerIndex: -1
    });

    // Clear emoji results (other search states are managed by useFloatingToolbar)
    setEmojiResults([]);
  }, []);

  // Detect trigger and show overlay
  const detectTriggerAndShowOverlay = useCallback(
    (text: string, cursorPosition: number) => {
      const hideOverlay = () => {
        setSearchOverlay({
          visible: false,
          type: null,
          query: '',
          triggerIndex: -1
        });
        setEmojiResults([]);
      };

      if (!text || cursorPosition < 0) {
        hideOverlay();
        return;
      }

      const beforeCursor = text.substring(0, cursorPosition);

      // Find the closest trigger character before cursor
      const hashIndex = beforeCursor.lastIndexOf('#');
      const atIndex = beforeCursor.lastIndexOf('@');
      const colonIndex = beforeCursor.lastIndexOf(':');

      const triggers = [
        { index: hashIndex, type: 'hashtag' as const, char: '#' },
        { index: atIndex, type: 'mention' as const, char: '@' },
        { index: colonIndex, type: 'emoji' as const, char: ':' }
      ].filter((t) => t.index >= 0);

      if (triggers.length === 0) {
        hideOverlay();
        return;
      }

      // Get the most recent trigger
      const lastTrigger = triggers.reduce((latest, current) =>
        current.index > latest.index ? current : latest
      );

      const query = beforeCursor.substring(lastTrigger.index + 1);

      // Enhanced termination conditions for different trigger types
      if (lastTrigger.type === 'hashtag') {
        if (
          query.includes(' ') ||
          (query === '' && beforeCursor.endsWith('# ')) ||
          /^[a-zA-Z0-9_-]+\s/.test(query)
        ) {
          hideOverlay();
          return;
        }

        const textAfterTrigger = text.substring(lastTrigger.index);
        const hashtagMatch = textAfterTrigger.match(/^#([a-zA-Z0-9_-]+)\s/);
        if (
          hashtagMatch &&
          cursorPosition === lastTrigger.index + hashtagMatch[0].length
        ) {
          hideOverlay();
          return;
        }
      } else if (lastTrigger.type === 'mention') {
        if (
          query.includes('[') ||
          query.includes(']') ||
          /^[a-zA-Z0-9_-]+\]\s/.test(query)
        ) {
          hideOverlay();
          return;
        }

        const textAfterTrigger = text.substring(lastTrigger.index);
        const mentionMatch = textAfterTrigger.match(
          /^@\[[^|\]]+\|[^|\]]+\|[^|\]]+\]\s/
        );
        if (
          mentionMatch &&
          cursorPosition === lastTrigger.index + mentionMatch[0].length
        ) {
          hideOverlay();
          return;
        }
      } else if (lastTrigger.type === 'emoji') {
        if (query.includes(' ') || query.endsWith(':')) {
          hideOverlay();
          return;
        }
      }

      // Don't show overlay for very short queries (but allow 1 character for emoji)
      const minQueryLength = lastTrigger.type === 'emoji' ? 1 : 2;
      if (query.length < minQueryLength) {
        hideOverlay();
        return;
      }

      // Update search queries based on type
      if (lastTrigger.type === 'hashtag' && enableHashtags) {
        setHashtagQuery(query);
      } else if (lastTrigger.type === 'mention' && enableUserMentions) {
        setMentionQuery(query);
      } else if (lastTrigger.type === 'emoji' && enableEmojis) {
        // Use emojiParser to get emoji suggestions
        try {
          const results = emojiParser.getSuggestions(query, 10);
          setEmojiResults(results);
        } catch (error) {
          console.warn('Error getting emoji suggestions:', error);
          setEmojiResults([]);
        }
      }

      // Store search overlay state
      setSearchOverlay({
        visible: true,
        type: lastTrigger.type,
        query: query,
        triggerIndex: lastTrigger.index
      });
    },
    [
      enableHashtags,
      enableUserMentions,
      enableEmojis,
      setHashtagQuery,
      setMentionQuery
    ]
  );

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (item: any, onCursorPosition?: (position: number) => void) => {
      // Generate the structured text
      let insertText = '';
      if (searchOverlay.type === 'mention') {
        insertText = `@[${item.displayName || item.label}|${item.value}|${mentionFilterType}] `;
      } else if (searchOverlay.type === 'hashtag') {
        insertText = item.value.startsWith('#')
          ? `${item.value} `
          : `#${item.value} `;
      } else if (searchOverlay.type === 'emoji') {
        insertText = item.unicode || `:${item.name}:`;
      }

      const currentValue = value || '';
      const triggerIndex = searchOverlay.triggerIndex;
      const queryLength = searchOverlay.query.length;
      const replaceEndIndex = triggerIndex + 1 + queryLength; // +1 for trigger character

      const beforeTrigger = currentValue.substring(0, triggerIndex);
      const afterQuery = currentValue.substring(replaceEndIndex);
      const newValue = beforeTrigger + insertText + afterQuery;

      // Calculate cursor position after insertion (at the end of inserted text)
      const newCursorPosition = triggerIndex + insertText.length;

      // Update the value
      onChange(newValue);

      // Hide search overlay directly
      setSearchOverlay({
        visible: false,
        type: null,
        query: '',
        triggerIndex: -1
      });
      setEmojiResults([]);

      // Set cursor position after the inserted text
      if (onCursorPosition) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          onCursorPosition(newCursorPosition);
        }, 0);
      }
    },
    [value, searchOverlay, onChange, mentionFilterType]
  );

  return {
    searchOverlay,
    searchResults: getSearchResults(),
    isSearchLoading: isSearchLoading(),
    handleSearchResultSelect,
    detectTriggerAndShowOverlay,
    hideSearchOverlay
  };
}
