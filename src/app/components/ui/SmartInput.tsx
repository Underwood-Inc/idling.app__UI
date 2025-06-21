'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import {
  PaginatedHashtagResult,
  PaginatedUserResult,
  searchHashtags,
  searchUsers
} from '../../../lib/actions/search.actions';
import {
  EmojiData,
  EmojiPicker,
  formatEmojiForText,
  useEmojiPicker
} from './EmojiPicker';
import {
  InlineSuggestionInput,
  InlineSuggestionInputProps,
  SuggestionItem
} from './InlineSuggestionInput';

export interface SmartInputProps
  extends Omit<InlineSuggestionInputProps, 'onHashtagSearch' | 'onUserSearch'> {
  enableHashtags?: boolean;
  enableUserMentions?: boolean;
  enableEmojis?: boolean;
  existingHashtags?: string[]; // Hashtags to exclude from search results
  existingUserIds?: string[]; // User IDs to exclude from search results
}

export const SmartInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  SmartInputProps
>(
  (
    {
      enableHashtags = true,
      enableUserMentions = true,
      enableEmojis = true,
      existingHashtags = [],
      existingUserIds = [],
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const emojiPicker = useEmojiPicker();

    // Expose the ref
    useImperativeHandle(ref, () => internalRef.current!, []);

    // Enhanced hashtag search function with pagination
    const handleHashtagSearch = async (
      query: string,
      page: number = 1
    ): Promise<{
      items: SuggestionItem[];
      hasMore: boolean;
      total: number;
    }> => {
      if (!enableHashtags) {
        return { items: [], hasMore: false, total: 0 };
      }

      try {
        const result: PaginatedHashtagResult = await searchHashtags(
          query,
          page
        );
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
    ): Promise<{
      items: SuggestionItem[];
      hasMore: boolean;
      total: number;
    }> => {
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

    // Handle emoji selection
    const handleEmojiSelect = useCallback(
      (emoji: EmojiData) => {
        if (!internalRef.current) return;

        const input = internalRef.current;
        const currentValue = value || '';
        const cursorPosition = input.selectionStart || 0;

        // Find the colon trigger position
        const beforeCursor = currentValue.slice(0, cursorPosition);
        const colonIndex = beforeCursor.lastIndexOf(':');

        if (colonIndex === -1) return;

        // Replace from colon position to cursor with emoji
        const emojiText = formatEmojiForText(emoji);
        const newValue =
          currentValue.slice(0, colonIndex) +
          emojiText +
          ' ' +
          currentValue.slice(cursorPosition);

        onChange(newValue);

        // Set cursor position after emoji
        setTimeout(() => {
          const newCursorPosition = colonIndex + emojiText.length + 1;
          input.setSelectionRange(newCursorPosition, newCursorPosition);
          input.focus();
        }, 0);
      },
      [value, onChange]
    );

    // Enhanced onChange to detect colon trigger for emojis
    const handleChange = useCallback(
      (newValue: string) => {
        // First call the original onChange
        onChange(newValue);

        if (!enableEmojis || !internalRef.current) {
          return;
        }

        const input = internalRef.current;
        const cursorPosition = input.selectionStart || 0;
        const beforeCursor = newValue.slice(0, cursorPosition);

        // Check for colon trigger
        const colonMatch = beforeCursor.match(/:(\w*)$/);

        if (colonMatch && enableEmojis) {
          const [, searchQuery] = colonMatch;
          const colonPosition = beforeCursor.lastIndexOf(':');

          // Get position for emoji picker
          const rect = input.getBoundingClientRect();
          const style = window.getComputedStyle(input);
          const fontSize = parseFloat(style.fontSize);

          // Estimate character width (rough approximation)
          const charWidth = fontSize * 0.6;
          const x = Math.min(
            rect.left + colonPosition * charWidth,
            window.innerWidth - 320
          );
          const y = rect.bottom + 5;

          emojiPicker.openAt(x, y, searchQuery);
        } else {
          emojiPicker.close();
        }
      },
      [onChange, enableEmojis, emojiPicker]
    );

    return (
      <>
        <InlineSuggestionInput
          {...props}
          value={value}
          onChange={handleChange}
          onHashtagSearch={enableHashtags ? handleHashtagSearch : undefined}
          onUserSearch={enableUserMentions ? handleUserSearch : undefined}
        />

        {enableEmojis && (
          <EmojiPicker
            isOpen={emojiPicker.isOpen}
            onClose={emojiPicker.close}
            onEmojiSelect={handleEmojiSelect}
            position={emojiPicker.position}
            searchQuery={emojiPicker.searchQuery}
          />
        )}
      </>
    );
  }
);

SmartInput.displayName = 'SmartInput';

// Export both components for flexibility
export { InlineSuggestionInput };
export type { InlineSuggestionInputProps, SuggestionItem };
