/**
 * Adapter component for the Lexical rich text editor
 * Provides compatibility with existing form components
 * 
 * This replaces the previous custom rich-input system with Lexical
 */

'use client';

import { LexicalRichEditor } from '@lib/lexical-editor';
import type { LexicalRichEditorRef } from '@lib/lexical-editor/components/LexicalRichEditor';
import type { MentionData } from '@lib/lexical-editor/types';
import React, { forwardRef, useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
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
  // Pill click handlers for filter removal
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (
    mention: string,
    filterType?: 'author' | 'mentions'
  ) => void;
}

export const RichInputAdapter = forwardRef<LexicalRichEditorRef, RichInputAdapterProps>(
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
      enableDebugLogging = false,
      onHashtagClick,
      onMentionClick
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lexicalRef = useRef<LexicalRichEditorRef>(null);
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
      richInputRef: lexicalRef as React.RefObject<{ insertText?: (text: string) => void; focus?: () => void }>
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

    // Enhanced search result selection with cursor positioning
    const handleSearchResultSelectWithCursor = useCallback(
      (item: any) => {
        const setCursorPosition = (position: number) => {
          // Lexical handles cursor positioning internally
          // After inserting, focus the editor
          if (lexicalRef.current?.focus) {
            lexicalRef.current.focus();
          }
        };

        // Ensure search overlay is hidden
        setSearchOverlayInteracting(false);

        handleSearchResultSelect(item, setCursorPosition);

        // Force focus back to the input after selection
        setTimeout(() => {
          if (lexicalRef.current?.focus) {
            lexicalRef.current.focus();
          }
        }, 10);
      },
      [handleSearchResultSelect]
    );

    // Handle URL auto-conversion
    const { handleValueChangeWithURLDetection } = useUrlAutoConversion({
      value,
      onChange,
      richInputRef: lexicalRef as React.RefObject<{ getState?: () => { cursorPosition?: { index: number } } }>
    });

    // Handle value changes from the Lexical editor
    const handleValueChange = useCallback(
      (newValue: string) => {
        // Update the value first
        onChange(newValue);

        // Detect search triggers (hashtags, mentions, emojis)
        // Get cursor position from the editor if available
        const cursorPos = newValue.length; // Fallback to end of text
        detectTriggerAndShowOverlay(newValue, cursorPos);
      },
      [onChange, detectTriggerAndShowOverlay]
    );

    // Process URL conversion on blur
    const handleEditorBlur = useCallback(() => {
      // Handle URL auto-conversion when user finishes typing
      handleValueChangeWithURLDetection(value, value);
      handleBlur();
    }, [value, handleValueChangeWithURLDetection, handleBlur]);

    // Handle interaction state changes
    const handleToolbarInteractionStart = useCallback(() => {
      setToolbarInteracting(true);
      setInteracting(true);
    }, [setInteracting]);

    const handleToolbarInteractionEnd = useCallback(() => {
      setToolbarInteracting(false);
      setInteracting(false);
      // Re-focus the input after toolbar interaction
      if (lexicalRef.current?.focus) {
        lexicalRef.current.focus();
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
                  handleSearchResultSelectWithCursor(item);
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
            backgroundColor: 'var(--bg-darker)',
            border: '1px solid var(--grey-dark)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
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
      handleSearchResultSelectWithCursor,
      hideSearchOverlay,
      handleSearchOverlayInteractionStart,
      handleSearchOverlayInteractionEnd
    ]);

    // Handle insertion from toolbar
    const handleInsertText = useCallback((text: string) => {
      if (lexicalRef.current?.insertText) {
        lexicalRef.current.insertText(text);
      } else {
        // Fallback: append to value
        onChange(value + text);
      }
    }, [onChange, value]);

    // Wrap onMentionClick to adapt the type signature
    const handleMentionClick = useCallback((mention: MentionData) => {
      if (onMentionClick) {
        onMentionClick(mention.displayName, mention.filterType);
      }
    }, [onMentionClick]);

    return (
      <div
        ref={containerRef}
        className="rich-input-adapter-container"
        data-rich-text-editor
      >
        <LexicalRichEditor
          ref={(instance) => {
            (lexicalRef as React.MutableRefObject<LexicalRichEditorRef | null>).current = instance;
            if (typeof ref === 'function') {
              ref(instance);
            } else if (ref) {
              ref.current = instance;
            }
          }}
          value={value}
          onChange={handleValueChange}
          placeholder={placeholder}
          className={`rich-input-adapter ${className} ${multiline ? 'rich-input-adapter--multiline' : 'rich-input-adapter--single-line'}`}
          contextId={contextId}
          viewMode={viewMode}
          multiline={multiline}
          disabled={disabled}
          enableHashtags={enableHashtags}
          enableMentions={enableUserMentions}
          enableEmojis={enableEmojis}
          enableUrls={true}
          enableMarkdown={false}
          enableImagePaste={enableImagePaste}
          mentionFilterType={mentionFilterType}
          onFocus={handleFocus}
          onBlur={handleEditorBlur}
          onHashtagClick={onHashtagClick}
          onMentionClick={handleMentionClick}
        />

        {/* Floating toolbar */}
        {(isFocused || toolbarInteracting) && (
          <FloatingToolbar
            inputRef={lexicalRef as React.RefObject<any>}
            onHashtagInsert={handleInsertText}
            onMentionInsert={handleInsertText}
            onEmojiInsert={handleInsertText}
            disabled={disabled}
            onToolbarInteractionStart={handleToolbarInteractionStart}
            onToolbarInteractionEnd={handleToolbarInteractionEnd}
          />
        )}

        {/* Search overlay */}
        {renderSearchTooltip()}
      </div>
    );
  }
);

RichInputAdapter.displayName = 'RichInputAdapter';
