'use client';

import React, { useCallback, useRef, useState } from 'react';
import { ContentWithPills } from '../../../ui/ContentWithPills';
import { SmartInput } from '../../../ui/SmartInput';
import { FloatingToolbar } from './FloatingToolbar';

interface SmartInputWithPillOverlayProps {
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

export const SmartInputWithPillOverlay: React.FC<
  SmartInputWithPillOverlayProps
> = ({
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
  const smartInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  // Handle URL behavior changes from pill edit controls
  const handleURLBehaviorChange = (oldContent: string, newContent: string) => {
    const currentValue = value || '';
    const newValue = currentValue.replace(oldContent, newContent);
    onChange(newValue);
  };

  // Handle focus events - FIXED to prevent toolbar disappearing
  const handleFocus = () => {
    setIsFocused(true);
    setShowToolbar(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within our container or a portal tooltip
    const relatedTarget = e.relatedTarget as Element;

    // Don't hide if focus is moving to:
    // 1. Something within our container
    // 2. A portal tooltip (has portal-tooltip class)
    // 3. Any element with toolbar-related classes
    if (
      relatedTarget &&
      (containerRef.current?.contains(relatedTarget) ||
        relatedTarget.closest('.portal-tooltip') ||
        relatedTarget.closest('.toolbar-tooltip-panel') ||
        relatedTarget.closest('.floating-toolbar'))
    ) {
      return;
    }

    // Use a longer delay and double-check focus hasn't returned
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (
        !containerRef.current?.contains(activeElement) &&
        !activeElement?.closest('.portal-tooltip') &&
        !activeElement?.closest('.toolbar-tooltip-panel') &&
        !activeElement?.closest('.floating-toolbar')
      ) {
        setIsFocused(false);
        setShowToolbar(false);
      }
    }, 150);
  };

  // Cursor position mapping - improved to handle visual to text position properly
  const mapVisualPositionToTextPosition = useCallback(
    (clickX: number, clickY: number): number => {
      if (!overlayRef.current || !value) return value.length;

      const overlay = overlayRef.current;
      const rect = overlay.getBoundingClientRect();
      const relativeX = clickX - rect.left - 12; // Account for padding
      const relativeY = clickY - rect.top - 8; // Account for padding

      // For very simple cases
      if (relativeX < 0 || relativeY < 0) return 0;
      if (relativeX > rect.width - 24) return value.length;

      if (multiline) {
        // For multiline, estimate line and position
        const lineHeight = 22;
        const targetLine = Math.floor(relativeY / lineHeight);
        const lines = value.split('\n');

        if (targetLine >= lines.length) return value.length;
        if (targetLine < 0) return 0;

        // Get position at start of target line
        let lineStartPosition = 0;
        for (let i = 0; i < targetLine; i++) {
          lineStartPosition += lines[i].length + 1; // +1 for newline
        }

        // Estimate character position within line (rough approximation)
        const targetLineText = lines[targetLine];
        const avgCharWidth = 8; // Approximate character width
        const charIndex = Math.min(
          Math.floor(relativeX / avgCharWidth),
          targetLineText.length
        );

        return lineStartPosition + charIndex;
      } else {
        // For single line, estimate character position
        const avgCharWidth = 8;
        const charIndex = Math.min(
          Math.floor(relativeX / avgCharWidth),
          value.length
        );
        return charIndex;
      }
    },
    [value, multiline]
  );

  // Handle clicks on the pill overlay with FIXED cursor positioning
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!smartInputRef.current) return;

    // Focus the input
    smartInputRef.current.focus();

    // Map visual click position to text cursor position
    const textPosition = mapVisualPositionToTextPosition(e.clientX, e.clientY);

    setTimeout(() => {
      if (smartInputRef.current) {
        smartInputRef.current.setSelectionRange(textPosition, textPosition);
      }
    }, 0);
  };

  // Handle toolbar insertions - FIXED to work with transparent input
  const handleInsertAtCursor = (text: string) => {
    if (!smartInputRef.current) return;

    // Get the actual input element (could be input or textarea)
    const inputElement = smartInputRef.current;

    // Try to get cursor position, fallback to end of text
    let cursorPosition = 0;
    try {
      cursorPosition = inputElement.selectionStart || value.length;
    } catch (e) {
      cursorPosition = value.length;
    }

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const newValue = beforeCursor + text + afterCursor;
    const newCursorPosition = cursorPosition + text.length;

    // Update the value
    onChange(newValue);

    // Focus and set cursor position with proper timing
    setTimeout(() => {
      if (inputElement) {
        try {
          inputElement.focus();
          inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        } catch (e) {
          // Fallback: just focus
          inputElement.focus();
        }
      }
    }, 20); // Longer delay to ensure DOM update
  };

  // Raw mode: just show SmartInput directly
  if (viewMode === 'raw') {
    return (
      <div
        className="smart-input-raw-container"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <SmartInput
          ref={smartInputRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`smart-input-raw ${className}`}
          disabled={disabled}
          as={multiline ? 'textarea' : 'input'}
          rows={multiline ? 4 : undefined}
          enableHashtags={enableHashtags}
          enableUserMentions={enableUserMentions}
          enableEmojis={enableEmojis}
          enableImagePaste={enableImagePaste}
        />
        {showToolbar && (
          <FloatingToolbar
            inputRef={smartInputRef}
            onHashtagInsert={(text) => handleInsertAtCursor(text)}
            onMentionInsert={(text) => handleInsertAtCursor(text)}
            onEmojiInsert={(text) => handleInsertAtCursor(text)}
            disabled={disabled}
          />
        )}
        <style jsx>{`
          .smart-input-raw-container {
            position: relative;
            width: 100%;
          }

          :global(.smart-input-raw) {
            width: 100%;
            min-height: ${multiline ? '60px' : '40px'};
            max-height: ${multiline ? '200px' : '40px'};
          }
        `}</style>
      </div>
    );
  }

  // Preview mode: SmartInput with pill overlay and floating toolbar
  return (
    <div
      ref={containerRef}
      className={`smart-input-with-overlay ${className} ${isFocused ? 'smart-input-with-overlay--focused' : ''}`}
    >
      {/* Pill rendering overlay - positioned behind input, clickable */}
      <div
        ref={overlayRef}
        className="pill-overlay"
        onClick={handleOverlayClick}
      >
        {value ? (
          <ContentWithPills
            content={value}
            contextId={contextId}
            isEditMode={true}
            onURLBehaviorChange={handleURLBehaviorChange}
          />
        ) : (
          <span className="pill-overlay-placeholder">{placeholder}</span>
        )}
      </div>

      {/* SmartInput with transparent text - keeps all functionality including emoji detection */}
      <div
        className="smart-input-wrapper"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <SmartInput
          ref={smartInputRef}
          value={value}
          onChange={onChange}
          placeholder=""
          className="smart-input-transparent"
          disabled={disabled}
          as={multiline ? 'textarea' : 'input'}
          rows={multiline ? 4 : undefined}
          enableHashtags={enableHashtags}
          enableUserMentions={enableUserMentions}
          enableEmojis={enableEmojis}
          enableImagePaste={enableImagePaste}
        />
      </div>

      {/* Floating toolbar */}
      {showToolbar && (
        <FloatingToolbar
          inputRef={smartInputRef}
          onHashtagInsert={(text) => handleInsertAtCursor(text)}
          onMentionInsert={(text) => handleInsertAtCursor(text)}
          onEmojiInsert={(text) => handleInsertAtCursor(text)}
          disabled={disabled}
        />
      )}

      <style jsx>{`
        .smart-input-with-overlay {
          position: relative;
          width: 100%;
          border: 1px solid var(--light-border--primary);
          border-radius: var(--border-radius);
          background: var(--light-background--primary);
          overflow: visible;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .smart-input-with-overlay--focused {
          border-color: var(--brand-primary) !important;
          box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2) !important;
        }

        .pill-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 8px 12px;
          min-height: ${multiline ? '60px' : '40px'};
          max-height: ${multiline ? '200px' : '40px'};
          overflow: ${multiline ? 'auto' : 'hidden'};
          white-space: ${multiline ? 'pre-wrap' : 'nowrap'};
          word-wrap: break-word;
          line-height: 1.4;
          pointer-events: auto;
          cursor: text;
          z-index: 1;
        }

        .pill-overlay-placeholder {
          color: var(--light-bg__text-color--secondary) !important;
          font-style: italic;
        }

        .smart-input-wrapper {
          position: relative;
          z-index: 2;
        }

        .smart-input-wrapper :global(.smart-input-transparent) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: transparent !important;
          caret-color: var(--brand-primary) !important;
          min-height: ${multiline ? '60px' : '40px'};
          max-height: ${multiline ? '200px' : '40px'};
        }

        .smart-input-wrapper :global(.smart-input-transparent:focus) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        .smart-input-wrapper :global(.inline-suggestion-input) {
          background: transparent !important;
          border: none !important;
          color: transparent !important;
          caret-color: var(--brand-primary) !important;
        }

        .smart-input-wrapper :global(.inline-suggestion-input:focus) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        /* Allow pill controls to be clickable through overlay */
        .pill-overlay :global(.url-pill__behavior-toggles) {
          pointer-events: auto;
          z-index: 1000;
        }

        .pill-overlay :global(.url-pill__behavior-toggle) {
          pointer-events: auto;
          z-index: 1001;
        }

        .pill-overlay :global(.url-pill__remove-button) {
          pointer-events: auto;
          z-index: 1001;
        }

        /* Show suggestions with high z-index - FIXED for emoji detection */
        .smart-input-wrapper :global(.suggestion-list) {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 20000 !important;
          background: var(--light-background--primary) !important;
          border: 1px solid var(--light-border--primary) !important;
          border-radius: var(--border-radius) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          margin-top: 2px !important;
        }

        /* FIXED: Ensure emoji picker from SmartInput appears correctly */
        .smart-input-wrapper :global(.emoji-picker) {
          position: fixed !important;
          z-index: 20000 !important;
          background: var(--light-background--primary) !important;
          border: 1px solid var(--light-border--primary) !important;
          border-radius: var(--border-radius) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        .smart-input-wrapper :global(.suggestion-item) {
          background: var(--light-background--primary) !important;
          color: var(--light-bg__text-color--primary) !important;
          border: none !important;
        }

        .smart-input-wrapper :global(.suggestion-item:hover) {
          background: var(--light-background--secondary) !important;
        }

        .smart-input-wrapper :global(.suggestion-item.selected) {
          background: var(--brand-primary) !important;
          color: white !important;
        }

        /* FIXED: Ensure emoji picker content renders properly */
        .smart-input-wrapper :global(.emoji-picker__content) {
          background: var(--light-background--primary) !important;
        }

        .smart-input-wrapper :global(.emoji-picker__header) {
          background: var(--light-background--secondary) !important;
          border-bottom: 1px solid var(--light-border--primary) !important;
        }

        .smart-input-wrapper :global(.emoji-picker__search) {
          background: var(--light-background--primary) !important;
          border: 1px solid var(--light-border--primary) !important;
          color: var(--light-bg__text-color--primary) !important;
        }

        .smart-input-wrapper :global(.emoji-picker__categories) {
          background: var(--light-background--secondary) !important;
          border-bottom: 1px solid var(--light-border--primary) !important;
        }

        .smart-input-wrapper :global(.emoji-picker__category) {
          background: var(--light-background--primary) !important;
          color: var(--light-bg__text-color--primary) !important;
          border: 1px solid var(--light-border--primary) !important;
        }

        .smart-input-wrapper :global(.emoji-picker__category--active) {
          background: var(--brand-primary) !important;
          color: white !important;
        }

        .smart-input-wrapper :global(.emoji-picker__emoji) {
          background: var(--light-background--primary) !important;
          color: var(--light-bg__text-color--primary) !important;
          border: 1px solid transparent !important;
        }

        .smart-input-wrapper :global(.emoji-picker__emoji:hover) {
          background: var(--light-background--secondary) !important;
          border-color: var(--brand-primary) !important;
        }
      `}</style>
    </div>
  );
};
