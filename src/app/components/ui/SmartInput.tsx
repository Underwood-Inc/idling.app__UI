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
  enableImagePaste?: boolean;
  existingHashtags?: string[]; // Hashtags to mark as disabled in search results
  existingUserIds?: string[]; // User IDs to mark as disabled in search results
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
      enableImagePaste = true,
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
        const mappedResults = result.items.map((hashtagResult) => {
          // Check if hashtag is already added
          const hashtagValue = hashtagResult.value.startsWith('#')
            ? hashtagResult.value
            : `#${hashtagResult.value}`;
          const isDisabled = existingHashtags.includes(hashtagValue);

          return {
            id: hashtagResult.id,
            value: hashtagResult.value,
            label: hashtagResult.label,
            type: 'hashtag' as const,
            disabled: isDisabled
          };
        });

        return {
          items: mappedResults,
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
        const mappedResults = result.items.map((userResult) => {
          // Check if user is already added (by user ID)
          const isDisabled = existingUserIds.includes(userResult.value);

          return {
            id: userResult.id,
            value: userResult.value, // author_id for filtering
            label: userResult.label,
            displayName: userResult.displayName, // author name for display
            avatar: userResult.avatar,
            type: 'user' as const,
            disabled: isDisabled
          };
        });

        return {
          items: mappedResults,
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

          // Get position for emoji picker (relative to document, not viewport)
          const rect = input.getBoundingClientRect();
          const style = window.getComputedStyle(input);
          const fontSize = parseFloat(style.fontSize);
          const scrollX =
            window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY =
            window.pageYOffset || document.documentElement.scrollTop;

          // Estimate character width (rough approximation)
          const charWidth = fontSize * 0.6;
          const x = Math.min(
            rect.left + scrollX + colonPosition * charWidth,
            window.innerWidth + scrollX - 320
          );
          const y = rect.bottom + scrollY + 5;

          emojiPicker.openAt(x, y, searchQuery);
        } else {
          emojiPicker.close();
        }
      },
      [onChange, enableEmojis, emojiPicker]
    );

    // Enhanced onChange with URL detection and auto-conversion
    const handleChangeWithURLDetection = useCallback(
      (newValue: string, previousValue?: string) => {
        // First call the emoji detection
        handleChange(newValue);

        // Only check for URL conversion if we just added a space
        const prevValue = previousValue || value || '';
        if (newValue.length <= prevValue.length) {
          return; // Don't convert on deletion
        }

        const lastChar = newValue[newValue.length - 1];
        if (lastChar !== ' ') {
          return; // Only convert when space is added
        }

        if (internalRef.current) {
          const input = internalRef.current;
          const cursorPosition = input.selectionStart || 0;

          // Look for the word before the space
          const beforeCursor = newValue.slice(0, cursorPosition - 1); // Exclude the space
          const words = beforeCursor.split(/\s+/);
          const lastWord = words[words.length - 1];

          // Check if the last word is a URL
          if (lastWord) {
            const urlRegex = /^https?:\/\/[^\s<>"{}|\\^`[\]]+$/;
            if (urlRegex.test(lastWord)) {
              const url = lastWord;

              // Import URL detection utilities
              import('../../../lib/config/url-pills')
                .then(({ findDomainConfig, createURLPill }) => {
                  const domainConfig = findDomainConfig(url);
                  if (domainConfig) {
                    // Convert URL to pill format
                    const pillFormat = createURLPill(
                      url,
                      domainConfig.defaultBehavior
                    );

                    // Replace the URL with the pill format
                    const beforeUrl = beforeCursor.slice(
                      0,
                      beforeCursor.lastIndexOf(lastWord)
                    );
                    const afterCursor = newValue.slice(cursorPosition);
                    const newContent =
                      beforeUrl + pillFormat + ' ' + afterCursor;

                    // Update the content
                    onChange(newContent);

                    // Set cursor position after the pill
                    setTimeout(() => {
                      const newCursorPosition =
                        beforeUrl.length + pillFormat.length + 1;
                      input.setSelectionRange(
                        newCursorPosition,
                        newCursorPosition
                      );
                      input.focus();
                    }, 0);
                  }
                })
                .catch((error) => {
                  console.error('Failed to load URL pill utilities:', error);
                });
            }
          }
        }
      },
      [handleChange, onChange, value]
    );

    // Enhanced onChange wrapper that tracks previous value
    const handleChangeWrapper = useCallback(
      (newValue: string) => {
        const prevValue = value;
        handleChangeWithURLDetection(newValue, prevValue);
      },
      [handleChangeWithURLDetection, value]
    );

    // Handle clipboard paste events
    const handlePaste = useCallback(
      async (e: React.ClipboardEvent) => {
        if (!enableImagePaste) return;

        const clipboardData = e.clipboardData;
        if (!clipboardData) return;

        // Check if there are files in the clipboard
        const files = Array.from(clipboardData.files);
        const imageFiles = files.filter((file) =>
          file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) return;

        // Prevent default paste behavior for images
        e.preventDefault();

        try {
          // Process each image file
          for (const file of imageFiles) {
            // Convert file to data URL for temporary storage
            const dataURL = await fileToDataURL(file);

            // Create temporary image pill format
            const tempImagePill = `![embed](data:temp-image;name=${encodeURIComponent(file.name)};${dataURL})`;

            // Insert at current cursor position
            if (internalRef.current) {
              const input = internalRef.current;
              const currentValue = value || '';
              const cursorPosition = input.selectionStart || 0;

              const before = currentValue.slice(0, cursorPosition);
              const after = currentValue.slice(cursorPosition);

              // Add spacing around the pill
              const spacing =
                before.length > 0 && !before.endsWith(' ') ? ' ' : '';
              const newValue = before + spacing + tempImagePill + ' ' + after;

              onChange(newValue);

              // Set cursor position after the inserted pill
              setTimeout(() => {
                const newCursorPosition =
                  before.length + spacing.length + tempImagePill.length + 1;
                input.setSelectionRange(newCursorPosition, newCursorPosition);
                input.focus();
              }, 0);
            }
          }
        } catch (error) {
          console.error('Failed to process pasted image:', error);
        }
      },
      [enableImagePaste, value, onChange]
    );

    // Helper function to convert file to data URL
    const fileToDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    return (
      <>
        <InlineSuggestionInput
          {...props}
          value={value}
          onChange={handleChangeWrapper}
          onPaste={handlePaste}
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
