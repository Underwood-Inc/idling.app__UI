/**
 * Adapter component for the new rich input system
 * Provides compatibility with existing form components
 */

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import {
  createURLPill,
  findDomainConfig
} from '../../../../../lib/config/url-pills';
import { RichInput } from '../../../../../lib/rich-input';
import { emojiParser } from '../../../../../lib/utils/parsers/emoji-parser';
import { InteractiveTooltip } from '../../../tooltip/InteractiveTooltip';
import { useFloatingToolbar } from '../hooks/useFloatingToolbar';
import { FloatingToolbar } from './FloatingToolbar';

interface RichInputAdapterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  contextId: string;
  multiline?: boolean;
  viewMode?: 'preview' | 'raw';
  enableHashtags?: boolean;
  enableUserMentions?: boolean;
  enableEmojis?: boolean;
  enableImagePaste?: boolean;
  mentionFilterType?: 'author' | 'mentions'; // Controls what filter type mentions should use
}

interface SearchOverlayState {
  visible: boolean;
  type: 'hashtag' | 'mention' | 'emoji' | null;
  query: string;
  position: { x: number; y: number };
  triggerIndex: number;
}

export const RichInputAdapter: React.FC<RichInputAdapterProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  contextId,
  multiline = false,
  viewMode = 'preview',
  enableHashtags = true,
  enableUserMentions = true,
  enableEmojis = true,
  enableImagePaste = true,
  mentionFilterType = 'author' // Default to author for backward compatibility
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const richInputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toolbarInteracting, setToolbarInteracting] = useState(false);
  const [searchOverlayInteracting, setSearchOverlayInteracting] =
    useState(false);
  const [searchOverlay, setSearchOverlay] = useState<SearchOverlayState>({
    visible: false,
    type: null,
    query: '',
    position: { x: 0, y: 0 },
    triggerIndex: -1
  });
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark as initialized after a short delay to ensure rich input is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 500); // Wait 500ms for initialization

    return () => clearTimeout(timer);
  }, []);

  // Extract existing hashtags from current value
  const extractExistingHashtags = useCallback((): string[] => {
    const hashtags: string[] = [];
    const hashtagRegex = /#\w+/g;
    let match;

    while ((match = hashtagRegex.exec(value)) !== null) {
      hashtags.push(match[0]);
    }

    return hashtags;
  }, [value]);

  // Extract existing user IDs from current value
  const extractExistingUserIds = useCallback((): string[] => {
    const userIds: string[] = [];
    const mentionRegex = /@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]/g;
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      // match[1] is username, match[2] is userId, match[3] is filterType (optional)
      userIds.push(match[2]);
    }

    return userIds;
  }, [value]);

  // Memoize extracted values to prevent unnecessary re-renders
  const existingHashtags = useMemo(
    () => extractExistingHashtags(),
    [extractExistingHashtags]
  );
  const existingUserIds = useMemo(
    () => extractExistingUserIds(),
    [extractExistingUserIds]
  );

  // Use existing hooks for search functionality with stable parameters
  const {
    hashtagQuery,
    setHashtagQuery,
    mentionQuery,
    setMentionQuery,
    hashtagResults,
    mentionResults,
    loadingHashtags,
    loadingMentions
  } = useFloatingToolbar(existingHashtags, existingUserIds);

  const [emojiResults, setEmojiResults] = useState<any[]>([]);

  // State for managing interactive tooltip content
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipTriggerRef, setTooltipTriggerRef] =
    useState<HTMLElement | null>(null);

  // Create a virtual trigger element for positioning the tooltip
  const createVirtualTrigger = useCallback(
    (x: number, y: number) => {
      const uniqueId = `rich-input-virtual-trigger-${contextId}`;

      // Remove any existing virtual trigger for this instance
      const existing = document.getElementById(uniqueId);
      if (existing) {
        existing.remove();
      }

      // Create a new virtual trigger element
      const trigger = document.createElement('div');
      trigger.id = uniqueId;
      trigger.style.position = 'fixed'; // Use fixed instead of absolute
      trigger.style.left = `${x}px`;
      trigger.style.top = `${y}px`;
      trigger.style.width = '1px';
      trigger.style.height = '1px';
      trigger.style.pointerEvents = 'none';
      trigger.style.zIndex = '-1';
      trigger.style.visibility = 'hidden';

      // Add a data attribute to identify this as our virtual trigger
      trigger.setAttribute('data-rich-input-trigger', 'true');
      trigger.setAttribute('data-context-id', contextId);

      document.body.appendChild(trigger);
      return trigger;
    },
    [contextId]
  );

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (item: any) => {
      // Replace only the partial mention, not the entire input
      // Get the current input value and replace from trigger to end of query
      const currentValue = value || '';
      const triggerIndex = searchOverlay.triggerIndex;
      const queryLength = searchOverlay.query.length;
      const replaceEndIndex = triggerIndex + 1 + queryLength; // +1 for trigger character

      // Generate the structured mention
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

      const beforeTrigger = currentValue.substring(0, triggerIndex);
      const afterQuery = currentValue.substring(replaceEndIndex);
      const newValue = beforeTrigger + insertText + afterQuery;

      // Call onChange with the properly replaced value
      onChange(newValue);

      // Move cursor to the end of the newly inserted structured mention
      setTimeout(() => {
        if (richInputRef.current) {
          // Get the current state to understand the visual structure
          if (richInputRef.current.getState) {
            const state = richInputRef.current.getState();
          }

          // Try to position cursor at the end of the new value
          const newCursorPosition = newValue.length;

          // Try different cursor positioning methods that might exist
          if (richInputRef.current.setCursor) {
            richInputRef.current.setCursor({
              index: newCursorPosition
            });
          } else if (richInputRef.current.setCursorPosition) {
            richInputRef.current.setCursorPosition(newCursorPosition);
          } else if (richInputRef.current.setSelection) {
            richInputRef.current.setSelection({
              start: { index: newCursorPosition },
              end: { index: newCursorPosition },
              direction: 'none'
            });
          }

          // Ensure focus is maintained
          if (richInputRef.current.focus) {
            richInputRef.current.focus();
          }
        }
      }, 50); // Longer timeout to ensure rich input has finished rendering

      // Hide overlay
      setSearchOverlay((prev) => ({ ...prev, visible: false }));
    },
    [value, searchOverlay, onChange, mentionFilterType]
  );

  // Update search overlay to use InteractiveTooltip
  const showSearchTooltip = useCallback(
    (
      type: 'hashtag' | 'mention' | 'emoji',
      query: string,
      position: { x: number; y: number }
    ) => {
      let results: any[] = [];
      let loading = false;
      let noResultsMessage = '';

      if (type === 'hashtag') {
        results = hashtagResults;
        loading = loadingHashtags;
        noResultsMessage = 'No hashtags found';
      } else if (type === 'mention') {
        results = mentionResults;
        loading = loadingMentions;
        noResultsMessage = 'No users found';
      } else if (type === 'emoji') {
        results = emojiResults;
        loading = false;
        noResultsMessage = 'No emojis found';
      }

      // eslint-disable-next-line no-console
      console.log('🔍 showSearchTooltip:', { type, query, results, loading });

      const content = (
        <div className="search-overlay-content">
          {loading && (
            <div className="search-overlay-loading">Searching...</div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="search-overlay-no-results">{noResultsMessage}</div>
          )}
          {results.map((item, index) => (
            <button
              key={item.id || index}
              className={`search-overlay-item ${item.disabled ? 'search-overlay-item--disabled' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!item.disabled) {
                  handleSearchResultSelect(item);
                  setTooltipVisible(false);
                }
              }}
              disabled={item.disabled}
              title={item.disabled ? 'Already selected' : undefined}
            >
              {type === 'hashtag' && (
                <span className="search-overlay-trigger">#</span>
              )}
              {type === 'mention' && (
                <span className="search-overlay-trigger">@</span>
              )}
              {type === 'emoji' && (
                <span className="search-overlay-trigger">:</span>
              )}
              <span className="search-overlay-label">
                {type === 'emoji' && item.unicode && (
                  <span className="search-overlay-emoji">{item.unicode}</span>
                )}
                {item.label || item.name}
              </span>
              {item.disabled && (
                <span className="search-overlay-indicator">✓</span>
              )}
            </button>
          ))}
        </div>
      );

      // Create virtual trigger element for positioning
      const trigger = createVirtualTrigger(position.x, position.y);
      setTooltipTriggerRef(trigger);
      setTooltipContent(content);
      setTooltipVisible(true);
    },
    [
      hashtagResults,
      mentionResults,
      emojiResults,
      loadingHashtags,
      loadingMentions,
      handleSearchResultSelect,
      createVirtualTrigger
    ]
  );

  // Hide search tooltip
  const hideSearchTooltip = useCallback(() => {
    setTooltipVisible(false);
    setTooltipContent(null);
    setTooltipTriggerRef(null);

    // Delay cleanup of virtual trigger to allow tooltip to finish positioning
    setTimeout(() => {
      const uniqueId = `rich-input-virtual-trigger-${contextId}`;
      const existing = document.getElementById(uniqueId);
      if (existing) {
        existing.remove();
      }
    }, 200); // Small delay to prevent positioning issues
  }, [contextId]);

  // Update the detectTriggerAndShowOverlay function to use the new tooltip system
  const detectTriggerAndShowOverlay = useCallback(
    (text: string, cursorPosition: number) => {
      if (!text || cursorPosition < 0) {
        hideSearchTooltip();
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
        hideSearchTooltip();
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
          hideSearchTooltip();
          return;
        }

        const textAfterTrigger = text.substring(lastTrigger.index);
        const hashtagMatch = textAfterTrigger.match(/^#([a-zA-Z0-9_-]+)\s/);
        if (
          hashtagMatch &&
          cursorPosition === lastTrigger.index + hashtagMatch[0].length
        ) {
          hideSearchTooltip();
          return;
        }
      } else if (lastTrigger.type === 'mention') {
        if (
          query.includes('[') ||
          query.includes(']') ||
          /^[a-zA-Z0-9_-]+\]\s/.test(query)
        ) {
          hideSearchTooltip();
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
          hideSearchTooltip();
          return;
        }
      } else if (lastTrigger.type === 'emoji') {
        if (query.includes(' ') || query.endsWith(':')) {
          hideSearchTooltip();
          return;
        }
      }

      // Don't show overlay for very short queries (but allow 1 character for emoji)
      const minQueryLength = lastTrigger.type === 'emoji' ? 1 : 2;
      if (query.length < minQueryLength) {
        hideSearchTooltip();
        return;
      }

      // Calculate position for tooltip (relative to viewport using fixed positioning)
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Use fixed positioning relative to viewport instead of absolute
      // Position the tooltip below the input field
      const position = {
        x: rect.left + 10, // Small offset from left edge
        y: rect.bottom + 5 // Position below the input with small gap
      };

      // Update search queries based on type
      if (lastTrigger.type === 'hashtag' && enableHashtags) {
        // eslint-disable-next-line no-console
        console.log('🔍 Setting hashtag query:', query);
        setHashtagQuery(query);
      } else if (lastTrigger.type === 'mention' && enableUserMentions) {
        // eslint-disable-next-line no-console
        console.log('🔍 Setting mention query:', query);
        setMentionQuery(query);
      } else if (lastTrigger.type === 'emoji' && enableEmojis) {
        // eslint-disable-next-line no-console
        console.log('🔍 Setting emoji query:', query);
        // Use emojiParser to get emoji suggestions
        try {
          const results = emojiParser.getSuggestions(query, 10);
          // eslint-disable-next-line no-console
          console.log('🔍 Emoji results:', results);
          setEmojiResults(results);
        } catch (error) {
          console.warn('Error getting emoji suggestions:', error);
          setEmojiResults([]);
        }
      }

      // Store search overlay state for the handleSearchResultSelect function
      setSearchOverlay({
        visible: true,
        type: lastTrigger.type,
        query: query,
        position: position,
        triggerIndex: lastTrigger.index
      });

      // For emoji, show tooltip immediately since results are synchronous
      if (lastTrigger.type === 'emoji') {
        showSearchTooltip(lastTrigger.type, query, position);
      }
      // For hashtags and mentions, the tooltip will be shown when results are available
      // via the useEffect hooks below
    },
    [
      enableHashtags,
      enableUserMentions,
      enableEmojis,
      setHashtagQuery,
      setMentionQuery,
      hideSearchTooltip,
      showSearchTooltip
    ]
  );

  // Show tooltip when hashtag results are available
  useEffect(() => {
    if (
      searchOverlay.visible &&
      searchOverlay.type === 'hashtag' &&
      hashtagResults.length > 0
    ) {
      showSearchTooltip(
        searchOverlay.type,
        searchOverlay.query,
        searchOverlay.position
      );
    }
  }, [hashtagResults, searchOverlay, showSearchTooltip]);

  // Show tooltip when mention results are available
  useEffect(() => {
    if (
      searchOverlay.visible &&
      searchOverlay.type === 'mention' &&
      mentionResults.length > 0
    ) {
      showSearchTooltip(
        searchOverlay.type,
        searchOverlay.query,
        searchOverlay.position
      );
    }
  }, [mentionResults, searchOverlay, showSearchTooltip]);

  // Show tooltip when loading states change (to show "Searching..." message)
  useEffect(() => {
    if (
      searchOverlay.visible &&
      searchOverlay.type === 'hashtag' &&
      loadingHashtags
    ) {
      showSearchTooltip(
        searchOverlay.type,
        searchOverlay.query,
        searchOverlay.position
      );
    }
  }, [loadingHashtags, searchOverlay, showSearchTooltip]);

  useEffect(() => {
    if (
      searchOverlay.visible &&
      searchOverlay.type === 'mention' &&
      loadingMentions
    ) {
      showSearchTooltip(
        searchOverlay.type,
        searchOverlay.query,
        searchOverlay.position
      );
    }
  }, [loadingMentions, searchOverlay, showSearchTooltip]);

  // Show tooltip for "no results" case when search is complete
  useEffect(() => {
    if (
      searchOverlay.visible &&
      searchOverlay.type === 'hashtag' &&
      !loadingHashtags &&
      hashtagResults.length === 0 &&
      searchOverlay.query.length >= 2
    ) {
      showSearchTooltip(
        searchOverlay.type,
        searchOverlay.query,
        searchOverlay.position
      );
    }
  }, [hashtagResults, loadingHashtags, searchOverlay, showSearchTooltip]);

  useEffect(() => {
    if (
      searchOverlay.visible &&
      searchOverlay.type === 'mention' &&
      !loadingMentions &&
      mentionResults.length === 0 &&
      searchOverlay.query.length >= 2
    ) {
      showSearchTooltip(
        searchOverlay.type,
        searchOverlay.query,
        searchOverlay.position
      );
    }
  }, [mentionResults, loadingMentions, searchOverlay, showSearchTooltip]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Handle value changes to detect triggers immediately
  const handleValueChange = useCallback(
    (newValue: string) => {
      // Call onChange immediately for responsive UI
      onChange(newValue);

      // Get cursor position from rich input immediately
      if (richInputRef.current && richInputRef.current.getState) {
        const state = richInputRef.current.getState();
        detectTriggerAndShowOverlay(newValue, state.cursorPosition.index);
      }
    },
    [onChange, detectTriggerAndShowOverlay]
  );

  // Enhanced value change handler with URL detection and auto-conversion
  const handleValueChangeWithURLDetection = useCallback(
    (newValue: string, previousValue?: string) => {
      // First call the original handler
      handleValueChange(newValue);

      // Check for URL conversion in two scenarios:
      // 1. When we just added a space or newline (typing scenario)
      // 2. When significant text was added (paste scenario)
      const prevValue = previousValue || value || '';
      if (newValue.length <= prevValue.length) {
        return; // Don't convert on deletion
      }

      const textAdded = newValue.length - prevValue.length;
      const lastChar = newValue[newValue.length - 1];

      // Scenario 1: User typed a space or newline after URL
      const isSpaceOrNewlineTrigger =
        (lastChar === ' ' || lastChar === '\n') && textAdded === 1;

      // Scenario 2: User pasted content (significant text addition)
      const isPasteTrigger = textAdded > 5; // Arbitrary threshold for paste detection

      if (!isSpaceOrNewlineTrigger && !isPasteTrigger) {
        return; // Only convert on space/newline or paste
      }

      // Get cursor position from rich input
      if (richInputRef.current) {
        const richInput = richInputRef.current;
        const state = richInput.getState?.();
        const cursorPosition = state?.cursorPosition?.index || newValue.length;

        let textToCheck: string;
        let searchEndIndex: number;

        if (isSpaceOrNewlineTrigger) {
          // For space/newline trigger, check the word before the trigger
          textToCheck = newValue.slice(0, cursorPosition - 1);
          searchEndIndex = cursorPosition - 1;
        } else {
          // For paste trigger, check all the newly added text
          textToCheck = newValue.slice(0, cursorPosition);
          searchEndIndex = cursorPosition;
        }

        // Find URLs in the text to check
        const words = textToCheck.split(/[\s\n]+/);
        const lastWord = words[words.length - 1];

        // Check if the last word is a URL
        if (lastWord) {
          const urlRegex = /^https?:\/\/[^\s<>"{}|\\^`[\]]+$/;
          const isURL = urlRegex.test(lastWord);

          if (isURL) {
            const url = lastWord;

            // Import URL detection utilities and convert
            const domainConfig = findDomainConfig(url);

            if (domainConfig) {
              // Convert URL to structured pill format
              const pillFormat = createURLPill(
                url,
                domainConfig.defaultBehavior
              );

              // Find the URL position in the text
              const urlStartIndex = textToCheck.lastIndexOf(lastWord);
              const urlEndIndex = urlStartIndex + lastWord.length;

              // Replace the URL with the pill format
              const beforeUrl = newValue.slice(0, urlStartIndex);
              const afterUrl = newValue.slice(urlEndIndex);

              let newContent: string;
              let newCursorPos: number;

              if (isSpaceOrNewlineTrigger) {
                // Keep the space/newline that triggered the conversion
                newContent =
                  beforeUrl + pillFormat + lastChar + afterUrl.slice(1);
                newCursorPos = beforeUrl.length + pillFormat.length + 1;
              } else {
                // For paste, just replace the URL
                newContent = beforeUrl + pillFormat + afterUrl;
                newCursorPos = beforeUrl.length + pillFormat.length;
              }

              // Update the content
              onChange(newContent);

              // Set cursor position after the pill using rich input API
              setTimeout(() => {
                if (richInputRef.current) {
                  richInput.setCursor?.({ index: newCursorPos });
                  richInput.focus?.();
                }
              }, 0);
            }
          }
        }
      }
    },
    [handleValueChange, onChange, value]
  );

  // Enhanced value change wrapper that tracks previous value
  const handleValueChangeWrapper = useCallback(
    (newValue: string) => {
      const prevValue = value;
      handleValueChangeWithURLDetection(newValue, prevValue);
    },
    [handleValueChangeWithURLDetection, value]
  );

  // Handle toolbar insertions
  const handleInsertAtCursor = useCallback(
    (text: string) => {
      if (richInputRef.current && richInputRef.current.insertText) {
        // Use the rich input's native insertText method for proper cursor positioning
        richInputRef.current.insertText(text);

        // Ensure focus is maintained
        setTimeout(() => {
          if (richInputRef.current && richInputRef.current.focus) {
            richInputRef.current.focus();
          }
        }, 0);
      } else if (richInputRef.current && richInputRef.current.getState) {
        // Enhanced fallback: insert at current cursor position
        const currentState = richInputRef.current.getState();
        const currentText = currentState.rawText;
        const cursorPosition = currentState.cursorPosition.index;

        const newText =
          currentText.substring(0, cursorPosition) +
          text +
          currentText.substring(cursorPosition);

        const newCursorPosition = cursorPosition + text.length;

        onChange(newText);

        // Set cursor position after insertion using rich input's methods
        setTimeout(() => {
          if (richInputRef.current) {
            if (richInputRef.current.focus) {
              richInputRef.current.focus();
            }
            // Use setCursor method if available (preferred over setSelection)
            if (richInputRef.current.setCursor) {
              richInputRef.current.setCursor({ index: newCursorPosition });
            } else if (richInputRef.current.setCursorPosition) {
              richInputRef.current.setCursorPosition(newCursorPosition);
            } else if (richInputRef.current.setSelection) {
              richInputRef.current.setSelection({
                start: { index: newCursorPosition },
                end: { index: newCursorPosition },
                direction: 'none'
              });
            }
          }
        }, 0);
      } else {
        // Final fallback: append to current value
        onChange(value + text);

        // Try to focus the input
        setTimeout(() => {
          if (richInputRef.current && richInputRef.current.focus) {
            richInputRef.current.focus();
          }
        }, 0);
      }
    },
    [value, onChange]
  );

  // Close search overlay when clicking outside
  useEffect(() => {
    if (!searchOverlay.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if we're interacting with the search overlay
      if (searchOverlayInteracting) {
        return;
      }

      const target = e.target as Element;
      if (
        !target.closest('.search-overlay') &&
        !target.closest('.rich-input-adapter-container')
      ) {
        setSearchOverlay((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOverlay.visible, searchOverlayInteracting]);

  // Raw mode: show simple textarea/input
  if (viewMode === 'raw') {
    return (
      <div className="rich-input-adapter-raw-container">
        {React.createElement(multiline ? 'textarea' : 'input', {
          value,
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => {
            const newValue = e.target.value;
            const cursorPosition = e.target.selectionStart || 0;
            onChange(newValue);
            detectTriggerAndShowOverlay(newValue, cursorPosition);
          },
          placeholder,
          className: `rich-input-adapter-raw ${className}`,
          disabled,
          rows: multiline ? 4 : undefined,
          onFocus: () => setIsFocused(true),
          onBlur: (
            e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => {
            // Use the same logic as preview mode
            setTimeout(() => {
              const activeElement = document.activeElement;
              const container = containerRef.current;

              if (
                !toolbarInteracting &&
                container &&
                activeElement &&
                !container.contains(activeElement)
              ) {
                setIsFocused(false);
              }
            }, 0);
          },
          onKeyUp: (
            e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement;
            detectTriggerAndShowOverlay(
              target.value,
              target.selectionStart || 0
            );
          },
          style: {
            width: '100%',
            minHeight: multiline ? '60px' : '40px',
            maxHeight: multiline ? '200px' : '40px',
            border: '1px solid var(--light-border--primary)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--light-background--primary)',
            color: 'var(--light-bg__text-color--primary)',
            padding: '8px 12px',
            fontSize: '14px',
            lineHeight: '1.4',
            fontFamily: 'inherit',
            resize: multiline ? 'vertical' : 'none'
          }
        })}

        {isFocused && (
          <FloatingToolbar
            inputRef={{ current: null }} // Not needed for raw mode
            onHashtagInsert={handleInsertAtCursor}
            onMentionInsert={handleInsertAtCursor}
            onEmojiInsert={handleInsertAtCursor}
            disabled={disabled}
            onToolbarInteractionStart={() => setToolbarInteracting(true)}
            onToolbarInteractionEnd={() => setToolbarInteracting(false)}
          />
        )}

        {tooltipVisible &&
          tooltipTriggerRef &&
          ReactDOM.createPortal(
            <InteractiveTooltip
              content={tooltipContent}
              triggerOnClick={false}
              className="search-overlay-tooltip"
              disabled={false}
            >
              <div
                style={{
                  position: 'absolute',
                  left: tooltipTriggerRef.style.left,
                  top: tooltipTriggerRef.style.top,
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none'
                }}
              />
            </InteractiveTooltip>,
            document.body
          )}
      </div>
    );
  }

  // Preview mode: use rich input
  return (
    <div
      ref={containerRef}
      className="rich-input-adapter-container"
      data-rich-text-editor
    >
      <RichInput
        ref={richInputRef}
        value={value}
        onChange={handleValueChangeWrapper}
        multiline={multiline}
        placeholder={placeholder}
        disabled={disabled}
        parsers={{
          hashtags: enableHashtags,
          mentions: enableUserMentions,
          urls: true,
          emojis: enableEmojis,
          images: enableImagePaste,
          markdown: false
        }}
        behavior={{
          smartSelection: true,
          autoComplete: false,
          spellCheck: true
        }}
        styling={{
          className: `rich-input-adapter ${className} ${multiline ? 'rich-input-adapter--multiline' : 'rich-input-adapter--single-line'}`,
          style: {
            minHeight: multiline ? '60px' : '40px',
            maxHeight: multiline ? '200px' : '40px',
            border: '1px solid var(--light-border--primary)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--light-background--primary)',
            padding: '8px 12px',
            fontSize: '14px',
            lineHeight: '1.4',
            fontFamily: 'inherit',
            overflow: multiline ? 'auto' : 'hidden',
            whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
            wordWrap: 'break-word'
          }
        }}
        handlers={{
          onFocus: () => {
            // Clear any pending focus loss
            if (focusTimeoutRef.current) {
              clearTimeout(focusTimeoutRef.current);
              focusTimeoutRef.current = null;
            }
            setIsFocused(true);
          },
          onBlur: () => {
            // Don't immediately lose focus - use a timeout to check if focus truly left
            // This prevents losing focus during internal operations like re-parsing
            if (focusTimeoutRef.current) {
              clearTimeout(focusTimeoutRef.current);
            }

            focusTimeoutRef.current = setTimeout(() => {
              // Only lose focus if we're not interacting with toolbar or search overlay
              // and focus has truly left the component
              if (!toolbarInteracting && !searchOverlayInteracting) {
                const activeElement = document.activeElement;
                const container = containerRef.current;

                // Check if focus is still within our component
                if (
                  !container ||
                  !activeElement ||
                  !container.contains(activeElement)
                ) {
                  setIsFocused(false);
                }
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  '🔍 OVERLAY: Preventing blur - interaction in progress:',
                  {
                    toolbarInteracting,
                    searchOverlayInteracting
                  }
                );
              }
            }, 150);
          }
        }}
      />

      {(isFocused || toolbarInteracting) && (
        <FloatingToolbar
          inputRef={richInputRef}
          onHashtagInsert={handleInsertAtCursor}
          onMentionInsert={handleInsertAtCursor}
          onEmojiInsert={handleInsertAtCursor}
          disabled={disabled}
          onToolbarInteractionStart={() => setToolbarInteracting(true)}
          onToolbarInteractionEnd={() => {
            setToolbarInteracting(false);
            // Re-focus the input after toolbar interaction
            if (richInputRef.current?.focus) {
              richInputRef.current.focus();
            }
          }}
        />
      )}

      {tooltipVisible &&
        tooltipTriggerRef &&
        ReactDOM.createPortal(
          <InteractiveTooltip
            content={tooltipContent}
            triggerOnClick={false}
            disabled={false}
          >
            <div
              style={{
                position: 'absolute',
                left: tooltipTriggerRef.style.left,
                top: tooltipTriggerRef.style.top,
                width: '1px',
                height: '1px',
                pointerEvents: 'none'
              }}
            />
          </InteractiveTooltip>,
          document.body
        )}

      <style jsx>{`
        .rich-input-adapter-container {
          position: relative;
          width: 100%;
        }

        .rich-input-adapter-container {
          position: relative;
          width: 100%;
        }

        /* Ensure pills are visible - both content-pill and rich-input-token classes */
        .rich-input-adapter .content-pill,
        .rich-input-adapter .rich-input-token--hashtag,
        .rich-input-adapter .rich-input-token--mention,
        .rich-input-adapter .rich-input-token--url {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 4px;
          padding: 2px 6px;
          margin: 0 1px;
          display: inline-block;
          font-weight: 500;
        }

        .rich-input-adapter .content-pill--hashtag,
        .rich-input-adapter .rich-input-token--hashtag {
          background: #e8f5e8;
          border-color: #4caf50;
          color: #2e7d32;
        }

        .rich-input-adapter .content-pill--mention,
        .rich-input-adapter .rich-input-token--mention {
          background: #fff3e0;
          border-color: #ff9800;
          color: #f57c00;
        }

        .rich-input-adapter .content-pill--url,
        .rich-input-adapter .rich-input-token--url {
          background: #f3e5f5;
          border-color: #9c27b0;
          color: #7b1fa2;
        }

        /* Make sure rich input content is visible */
        .rich-input-adapter .rich-input-content {
          min-height: 1.2em;
          line-height: 1.4;
        }

        /* Style the cursor */
        .rich-input-adapter .rich-input-cursor {
          background-color: var(--brand-primary, #edae49) !important;
          width: 2px !important;
          height: 1.2em !important;
        }

        .rich-input-adapter-raw-container {
          position: relative;
          width: 100%;
        }

        :global(.rich-input-adapter) {
          font-family: inherit;
        }

        :global(.rich-input-adapter--focused) {
          border-color: var(--brand-primary) !important;
          box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2) !important;
        }

        /* Ensure pills use existing styles */
        :global(.rich-input-adapter .content-pill) {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          margin: 0 1px;
          border-radius: 12px;
          font-size: 0.875em;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        :global(.rich-input-adapter .content-pill--hashtag) {
          background-color: var(--hashtag-bg, rgba(0, 123, 255, 0.1));
          color: var(--hashtag-color, #007bff);
          border: 1px solid var(--hashtag-border, rgba(0, 123, 255, 0.3));
        }

        :global(.rich-input-adapter .content-pill--mention) {
          background-color: var(--mention-bg, rgba(40, 167, 69, 0.1));
          color: var(--mention-color, #28a745);
          border: 1px solid var(--mention-border, rgba(40, 167, 69, 0.3));
        }

        :global(.rich-input-adapter .content-pill--url) {
          background-color: var(--url-bg, rgba(255, 193, 7, 0.1));
          color: var(--url-color, #ffc107);
          border: 1px solid var(--url-border, rgba(255, 193, 7, 0.3));
        }

        :global(.rich-input-adapter .content-pill:hover) {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Emoji styles */
        :global(.rich-input-adapter .emoji) {
          display: inline-block;
          font-size: 1.1em;
          vertical-align: middle;
        }

        :global(.rich-input-adapter .emoji--custom) {
          width: 1.2em;
          height: 1.2em;
          object-fit: contain;
        }

        .search-overlay-content {
          max-height: 200px;
          overflow-y: auto;
          padding: 4px 0;
        }

        .search-overlay-loading,
        .search-overlay-no-results {
          padding: 8px 12px;
          color: var(--light-bg__text-color--secondary);
          font-size: 0.875rem;
        }

        .search-overlay-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          color: var(--light-bg__text-color--primary);
          text-align: left;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.15s ease;
        }

        .search-overlay-item:hover:not(:disabled) {
          background: var(--light-background--secondary);
        }

        .search-overlay-item--disabled {
          color: var(--light-bg__text-color--secondary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .search-overlay-trigger {
          color: var(--brand-primary);
          font-weight: 600;
        }

        .search-overlay-label {
          flex: 1;
        }

        .search-overlay-indicator {
          color: #28a745;
          font-weight: bold;
          font-size: 1.1em;
          margin-left: auto;
        }

        .search-overlay {
          background: var(--light-background--primary);
          border: 1px solid var(--light-border--primary);
          border-radius: var(--border-radius);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          max-width: 300px;
          max-height: 200px;
          overflow: hidden;
          z-index: 10000;
        }

        @media (prefers-color-scheme: dark) {
          .search-overlay {
            background: var(--dark-background--primary);
            border-color: var(--dark-border--primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .search-overlay-loading,
          .search-overlay-no-results {
            color: var(--dark-bg__text-color--secondary);
          }

          .search-overlay-item {
            color: var(--dark-bg__text-color--primary);
          }

          .search-overlay-item:hover:not(:disabled) {
            background: var(--dark-background--secondary);
          }

          .search-overlay-item--disabled {
            color: var(--dark-bg__text-color--secondary);
          }
        }
      `}</style>
    </div>
  );
};
