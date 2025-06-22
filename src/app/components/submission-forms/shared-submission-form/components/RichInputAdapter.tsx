/**
 * Adapter component for the new rich input system
 * Provides compatibility with existing form components
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RichInput } from '../../../../../lib/rich-input';
import { emojiParser } from '../../../../../lib/utils/parsers/emoji-parser';
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
  enableImagePaste = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const richInputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [toolbarInteracting, setToolbarInteracting] = useState(false);
  const [searchOverlay, setSearchOverlay] = useState<SearchOverlayState>({
    visible: false,
    type: null,
    query: '',
    position: { x: 0, y: 0 },
    triggerIndex: -1
  });
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use existing hooks for search functionality
  const {
    hashtagQuery,
    setHashtagQuery,
    mentionQuery,
    setMentionQuery,
    hashtagResults,
    mentionResults,
    loadingHashtags,
    loadingMentions
  } = useFloatingToolbar();

  const [emojiResults, setEmojiResults] = useState<any[]>([]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Detect trigger characters and show search overlay
  const detectTriggerAndShowOverlay = useCallback(
    (text: string, cursorPosition: number) => {
      if (!text || cursorPosition < 0) {
        setSearchOverlay((prev) => ({ ...prev, visible: false }));
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
        setSearchOverlay((prev) => ({ ...prev, visible: false }));
        return;
      }

      // Get the most recent trigger
      const lastTrigger = triggers.reduce((latest, current) =>
        current.index > latest.index ? current : latest
      );

      const query = beforeCursor.substring(lastTrigger.index + 1);

      // Enhanced termination conditions for different trigger types
      if (lastTrigger.type === 'hashtag') {
        // For hashtags, terminate if:
        // 1. Query contains spaces
        // 2. Query is empty and cursor is right after a completed hashtag (ends with space)
        // 3. Query looks like a completed hashtag followed by space
        if (
          query.includes(' ') ||
          (query === '' && beforeCursor.endsWith('# ')) ||
          /^[a-zA-Z0-9_-]+\s/.test(query)
        ) {
          setSearchOverlay((prev) => ({ ...prev, visible: false }));
          return;
        }

        // Also check if we're immediately after a completed hashtag
        const textAfterTrigger = text.substring(lastTrigger.index);
        const hashtagMatch = textAfterTrigger.match(/^#([a-zA-Z0-9_-]+)\s/);
        if (
          hashtagMatch &&
          cursorPosition === lastTrigger.index + hashtagMatch[0].length
        ) {
          setSearchOverlay((prev) => ({ ...prev, visible: false }));
          return;
        }
      } else if (lastTrigger.type === 'mention') {
        // For mentions, check if we're in a structured format or completed mention
        if (
          query.includes('[') ||
          query.includes(']') ||
          /^[a-zA-Z0-9_-]+\]\s/.test(query)
        ) {
          setSearchOverlay((prev) => ({ ...prev, visible: false }));
          return;
        }

        // Check for completed structured mentions like @[username|id|author]
        const textAfterTrigger = text.substring(lastTrigger.index);
        const mentionMatch = textAfterTrigger.match(
          /^@\[[^|\]]+\|[^|\]]+\|[^|\]]+\]\s/
        );
        if (
          mentionMatch &&
          cursorPosition === lastTrigger.index + mentionMatch[0].length
        ) {
          setSearchOverlay((prev) => ({ ...prev, visible: false }));
          return;
        }
      } else if (lastTrigger.type === 'emoji') {
        // For emojis, terminate if query contains spaces or ends with :
        if (query.includes(' ') || query.endsWith(':')) {
          setSearchOverlay((prev) => ({ ...prev, visible: false }));
          return;
        }
      }

      // Don't show overlay for very short queries (less than 1 character)
      if (query.length < 1) {
        setSearchOverlay((prev) => ({ ...prev, visible: false }));
        return;
      }

      // Calculate position for overlay
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const position = {
        x: rect.left + 10, // Simple positioning for now
        y: rect.bottom + 5
      };

      // Update search queries based on type
      if (lastTrigger.type === 'hashtag' && enableHashtags) {
        setHashtagQuery(query);
      } else if (lastTrigger.type === 'mention' && enableUserMentions) {
        setMentionQuery(query);
      } else if (lastTrigger.type === 'emoji' && enableEmojis) {
        // Search emojis using emoji parser
        const results = emojiParser.getSuggestions(query, 10);
        setEmojiResults(results);
      }

      setSearchOverlay({
        visible: true,
        type: lastTrigger.type,
        query,
        position,
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

  // Handle value changes to detect triggers with debouncing
  const handleValueChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      // Clear any existing debounce
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      // Debounce the trigger detection to prevent flickering
      searchDebounceRef.current = setTimeout(() => {
        // Get cursor position from rich input
        if (richInputRef.current && richInputRef.current.getState) {
          const state = richInputRef.current.getState();
          detectTriggerAndShowOverlay(newValue, state.cursorPosition.index);
        }
      }, 100); // 100ms debounce
    },
    [onChange, detectTriggerAndShowOverlay]
  );

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (item: any) => {
      if (!richInputRef.current || searchOverlay.triggerIndex < 0) return;

      const currentState = richInputRef.current.getState();
      const currentText = currentState.rawText;

      let insertText = '';
      let replaceLength = searchOverlay.query.length + 1; // +1 for trigger character

      if (searchOverlay.type === 'hashtag') {
        insertText = item.value.startsWith('#')
          ? `${item.value} `
          : `#${item.value} `;
      } else if (searchOverlay.type === 'mention') {
        insertText = `@[${item.displayName || item.label}|${item.value}|author] `;
      } else if (searchOverlay.type === 'emoji') {
        // Handle emoji parser result format
        insertText = item.unicode || `:${item.name}:`;
      }

      // Replace the trigger and query with the selected item
      const newText =
        currentText.substring(0, searchOverlay.triggerIndex) +
        insertText +
        currentText.substring(searchOverlay.triggerIndex + replaceLength);

      onChange(newText);
      setSearchOverlay((prev) => ({ ...prev, visible: false }));

      // Focus back to input
      setTimeout(() => {
        if (richInputRef.current && richInputRef.current.focus) {
          richInputRef.current.focus();
        }
      }, 0);
    },
    [searchOverlay, onChange]
  );

  // Handle toolbar insertions
  const handleInsertAtCursor = useCallback(
    (text: string) => {
      if (richInputRef.current && richInputRef.current.insertText) {
        richInputRef.current.insertText(text);
      } else {
        // Fallback: append to current value
        onChange(value + text);
      }
    },
    [value, onChange]
  );

  // Close search overlay when clicking outside
  useEffect(() => {
    if (!searchOverlay.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
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
  }, [searchOverlay.visible]);

  // Render search overlay
  const renderSearchOverlay = () => {
    if (!searchOverlay.visible || !searchOverlay.type) return null;

    let results: any[] = [];
    let loading = false;
    let noResultsMessage = '';

    if (searchOverlay.type === 'hashtag') {
      results = hashtagResults;
      loading = loadingHashtags;
      noResultsMessage = 'No hashtags found';
    } else if (searchOverlay.type === 'mention') {
      results = mentionResults;
      loading = loadingMentions;
      noResultsMessage = 'No users found';
    } else if (searchOverlay.type === 'emoji') {
      results = emojiResults;
      loading = false;
      noResultsMessage = 'No emojis found';
    }

    return createPortal(
      <div
        className="search-overlay"
        style={{
          position: 'fixed',
          left: searchOverlay.position.x,
          top: searchOverlay.position.y,
          zIndex: 10000,
          minWidth: '200px',
          maxWidth: '300px',
          maxHeight: '200px',
          background: 'var(--light-background--primary)',
          border: '1px solid var(--light-border--primary)',
          borderRadius: 'var(--border-radius)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px 0'
          }}
        >
          {loading && (
            <div
              style={{
                padding: '8px 12px',
                color: 'var(--light-bg__text-color--secondary)',
                fontSize: '0.875rem'
              }}
            >
              Searching...
            </div>
          )}

          {!loading &&
            results.length === 0 &&
            searchOverlay.query.length >= 2 && (
              <div
                style={{
                  padding: '8px 12px',
                  color: 'var(--light-bg__text-color--secondary)',
                  fontSize: '0.875rem'
                }}
              >
                {noResultsMessage}
              </div>
            )}

          {results.map((item, index) => (
            <button
              key={item.id || index}
              onClick={() => handleSearchResultSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                color: 'var(--light-bg__text-color--primary)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--light-background--secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {searchOverlay.type === 'hashtag' && (
                <>
                  <span
                    style={{ color: 'var(--brand-primary)', fontWeight: '600' }}
                  >
                    #
                  </span>
                  <span>{item.label}</span>
                </>
              )}

              {searchOverlay.type === 'mention' && (
                <>
                  {item.avatar && (
                    <img
                      src={item.avatar}
                      alt=""
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <span
                    style={{ color: 'var(--brand-primary)', fontWeight: '600' }}
                  >
                    @
                  </span>
                  <span>{item.label}</span>
                </>
              )}

              {searchOverlay.type === 'emoji' && (
                <>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={`:${item.name}:`}
                      style={{
                        width: '20px',
                        height: '20px',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '16px' }}>
                      {item.unicode || `:${item.name}:`}
                    </span>
                  )}
                  <span>:{item.name}:</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

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

        {renderSearchOverlay()}
      </div>
    );
  }

  // Preview mode: use rich input
  return (
    <div ref={containerRef} className="rich-input-adapter-container">
      <RichInput
        ref={richInputRef}
        value={value}
        onChange={handleValueChange}
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
              // Only lose focus if we're not interacting with toolbar
              // and focus has truly left the component
              if (!toolbarInteracting) {
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

      {renderSearchOverlay()}

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
      `}</style>
    </div>
  );
};
