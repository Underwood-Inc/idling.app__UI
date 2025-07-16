/**
 * Adapter component for the new rich input system
 * Provides compatibility with existing form components
 */

'use client';

import React, { forwardRef, useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { RichInput } from '../../../../../lib/rich-input';
import { useFocusManagement } from '../hooks/useFocusManagement';
import { useSearchOverlay } from '../hooks/useSearchOverlay';
import { useTextInsertion } from '../hooks/useTextInsertion';
import { useUrlAutoConversion } from '../hooks/useUrlAutoConversion';
import { useValueExtraction } from '../hooks/useValueExtraction';
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
  mentionFilterType?: 'author' | 'mentions';
  enableDebugLogging?: boolean;
}

export const RichInputAdapter = forwardRef<any, RichInputAdapterProps>(
  (
    {
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
      mentionFilterType = 'author',
      enableDebugLogging = true
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const richInputRef = useRef<any>(null);
    const [toolbarInteracting, setToolbarInteracting] = useState(false);
    const [searchOverlayInteracting, setSearchOverlayInteracting] =
      useState(false);

    // Extract structured content from current value
    const { existingHashtags, existingUserIds } = useValueExtraction(value);

    // Handle focus management
    const { isFocused, handleFocus, handleBlur, setInteracting } =
      useFocusManagement({
        containerRef,
        blurDelay: 150
      });

    // Handle text insertion at cursor
    const { insertAtCursor } = useTextInsertion({
      value,
      onChange,
      richInputRef
    });

    // Handle search overlay functionality
    const {
      searchOverlay,
      searchResults,
      isSearchLoading,
      handleSearchResultSelect,
      detectTriggerAndShowOverlay,
      hideSearchOverlay
    } = useSearchOverlay({
      value,
      onChange,
      existingHashtags,
      existingUserIds,
      mentionFilterType,
      enableHashtags,
      enableUserMentions,
      enableEmojis
    });

    // Handle URL auto-conversion
    const { handleValueChangeWithURLDetection } = useUrlAutoConversion({
      value,
      onChange,
      richInputRef
    });

    // Simple value change handler - only update value and detect search triggers
    const handleValueChange = useCallback(
      (newValue: string) => {
        // Always update the value first for responsive typing
        onChange(newValue);

        // Only detect search triggers for immediate feedback (hashtags, mentions, emojis)
        if (richInputRef.current?.getState) {
          const state = richInputRef.current.getState();
          detectTriggerAndShowOverlay(
            newValue,
            state.cursorPosition?.index || 0
          );
        }
      },
      [onChange, detectTriggerAndShowOverlay]
    );

    // Process URL conversion and other heavy processing on blur/enter
    const handleProcessing = useCallback(
      (finalValue: string) => {
        const previousValue = value;

        // Handle URL auto-conversion when user finishes typing
        handleValueChangeWithURLDetection(finalValue, previousValue);
      },
      [value, handleValueChangeWithURLDetection]
    );

    // Handle interaction state changes
    const handleToolbarInteractionStart = useCallback(() => {
      setToolbarInteracting(true);
      setInteracting(true);
    }, [setInteracting]);

    const handleToolbarInteractionEnd = useCallback(() => {
      setToolbarInteracting(false);
      setInteracting(false);
      // Re-focus the input after toolbar interaction
      if (richInputRef.current?.focus) {
        richInputRef.current.focus();
      }
    }, [setInteracting]);

    const handleSearchOverlayInteractionStart = useCallback(() => {
      setSearchOverlayInteracting(true);
      setInteracting(true);
    }, [setInteracting]);

    const handleSearchOverlayInteractionEnd = useCallback(() => {
      setSearchOverlayInteracting(false);
      setInteracting(false);
    }, [setInteracting]);

    // Render search tooltip content
    const renderSearchTooltip = useCallback(() => {
      if (!searchOverlay.visible) return null;

      const content = (
        <div
          className="search-overlay-content"
          onMouseEnter={handleSearchOverlayInteractionStart}
          onMouseLeave={handleSearchOverlayInteractionEnd}
        >
          {isSearchLoading && (
            <div className="search-overlay-loading">Searching...</div>
          )}
          {!isSearchLoading &&
            searchResults.length === 0 &&
            searchOverlay.query.length >= 2 && (
              <div className="search-overlay-no-results">
                No {searchOverlay.type}s found
              </div>
            )}
          {searchResults.map((item, index) => (
            <button
              key={item.id || index}
              className={`search-overlay-item ${item.disabled ? 'search-overlay-item--disabled' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!item.disabled) {
                  handleSearchResultSelect(item);
                }
              }}
              disabled={item.disabled}
              title={item.disabled ? 'Already selected' : undefined}
            >
              {searchOverlay.type === 'hashtag' && (
                <span className="search-overlay-trigger">#</span>
              )}
              {searchOverlay.type === 'mention' && (
                <span className="search-overlay-trigger">@</span>
              )}
              {searchOverlay.type === 'emoji' && (
                <span className="search-overlay-trigger">:</span>
              )}
              <span className="search-overlay-label">
                {searchOverlay.type === 'emoji' && item.unicode && (
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

      // Calculate position relative to the input container
      const containerRect = containerRef.current?.getBoundingClientRect();
      // Check if we're inside a modal context for elevated z-index
      const isInModal =
        containerRef.current?.closest('.modal-context') !== null;
      const modalAwareZIndex = isInModal ? 10000002 : 1000;

      const tooltipStyle = containerRect
        ? {
            position: 'fixed' as const,
            top: containerRect.bottom + 4,
            left: containerRect.left,
            zIndex: modalAwareZIndex,
            pointerEvents: 'auto' as const
          }
        : {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            zIndex: modalAwareZIndex,
            pointerEvents: 'auto' as const
          };

      return ReactDOM.createPortal(
        <div
          style={{
            ...tooltipStyle,
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '200px'
          }}
        >
          {content}
        </div>,
        document.body
      );
    }, [
      searchOverlay,
      searchResults,
      isSearchLoading,
      handleSearchResultSelect,
      hideSearchOverlay,
      handleSearchOverlayInteractionStart,
      handleSearchOverlayInteractionEnd
    ]);

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
            onFocus: handleFocus,
            onBlur: () => {
              // Process URL conversion and other heavy logic on blur
              handleProcessing(value);
              // Then handle focus management
              handleBlur();
            },
            onKeyDown: (
              e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => {
              if (e.key === 'Enter') {
                // Process URL conversion and other heavy logic on Enter
                handleProcessing(value);
              }
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
              inputRef={{ current: null }}
              onHashtagInsert={insertAtCursor}
              onMentionInsert={insertAtCursor}
              onEmojiInsert={insertAtCursor}
              disabled={disabled}
              onToolbarInteractionStart={handleToolbarInteractionStart}
              onToolbarInteractionEnd={handleToolbarInteractionEnd}
            />
          )}

          {renderSearchTooltip()}
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
          ref={(instance) => {
            richInputRef.current = instance;
            if (typeof ref === 'function') {
              ref(instance);
            } else if (ref) {
              ref.current = instance;
            }
          }}
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
            onFocus: handleFocus,
            onBlur: () => {
              // Process URL conversion and other heavy logic on blur
              handleProcessing(value);
              // Then handle focus management
              handleBlur();
            }
          }}
          enableDebugLogging={enableDebugLogging}
        >
          {(isFocused || toolbarInteracting) && (
            <FloatingToolbar
              inputRef={richInputRef}
              onHashtagInsert={insertAtCursor}
              onMentionInsert={insertAtCursor}
              onEmojiInsert={insertAtCursor}
              disabled={disabled}
              onToolbarInteractionStart={handleToolbarInteractionStart}
              onToolbarInteractionEnd={handleToolbarInteractionEnd}
            />
          )}
        </RichInput>

        {renderSearchTooltip()}
      </div>
    );
  }
);

RichInputAdapter.displayName = 'RichInputAdapter';
