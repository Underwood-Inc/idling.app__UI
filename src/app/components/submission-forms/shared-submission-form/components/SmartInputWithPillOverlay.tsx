'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [visualCursorPosition, setVisualCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  // Smart pill selection functions
  const findPillAt = useCallback(
    (
      position: number
    ): { start: number; end: number; type: 'hashtag' | 'mention' } | null => {
      if (!value) return null;

      const pillRegex = /(#\w+)|(@\[[^\]]+\])/g;
      let match;

      while ((match = pillRegex.exec(value)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;

        if (position >= start && position <= end) {
          return {
            start,
            end,
            type: match[1] ? 'hashtag' : 'mention'
          };
        }
      }

      return null;
    },
    [value]
  );

  const expandSelectionToPills = useCallback(
    (startPos: number, endPos: number): { start: number; end: number } => {
      if (!value) return { start: startPos, end: endPos };

      let expandedStart = startPos;
      let expandedEnd = endPos;

      // Find pill containing start position
      const startPill = findPillAt(startPos);
      if (startPill) {
        expandedStart = startPill.start;
      }

      // Find pill containing end position
      const endPill = findPillAt(endPos);
      if (endPill) {
        expandedEnd = endPill.end;
      }

      // If we're selecting across multiple pills, include all pills in between
      const pillRegex = /(#\w+)|(@\[[^\]]+\])/g;
      let match;

      while ((match = pillRegex.exec(value)) !== null) {
        const pillStart = match.index;
        const pillEnd = match.index + match[0].length;

        // If this pill overlaps with our expanded selection, include it
        if (
          (pillStart >= expandedStart && pillStart <= expandedEnd) ||
          (pillEnd >= expandedStart && pillEnd <= expandedEnd) ||
          (pillStart <= expandedStart && pillEnd >= expandedEnd)
        ) {
          expandedStart = Math.min(expandedStart, pillStart);
          expandedEnd = Math.max(expandedEnd, pillEnd);
        }
      }

      return { start: expandedStart, end: expandedEnd };
    },
    [value, findPillAt]
  );

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

    // Update visual cursor on focus
    setTimeout(() => {
      if (smartInputRef.current) {
        const cursorPos = smartInputRef.current.selectionStart || 0;
        updateVisualCursor(cursorPos);
      }
    }, 0);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within our container or a portal tooltip
    const relatedTarget = e.relatedTarget as Element;

    // Don't hide if focus is moving to:
    // 1. Something within our container
    // 2. A portal tooltip (has portal-tooltip class)
    // 3. Any element with toolbar-related classes
    // 4. InteractiveTooltip content
    // 5. EmojiPicker content
    if (
      relatedTarget &&
      (containerRef.current?.contains(relatedTarget) ||
        relatedTarget.closest('.portal-tooltip') ||
        relatedTarget.closest('.toolbar-tooltip-panel') ||
        relatedTarget.closest('.floating-toolbar') ||
        relatedTarget.closest('.interactive-tooltip') ||
        relatedTarget.closest('.link-tooltip') ||
        relatedTarget.closest('.emoji-picker') ||
        relatedTarget.closest('.toolbar-emoji-picker'))
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
        !activeElement?.closest('.floating-toolbar') &&
        !activeElement?.closest('.interactive-tooltip') &&
        !activeElement?.closest('.link-tooltip') &&
        !activeElement?.closest('.emoji-picker') &&
        !activeElement?.closest('.toolbar-emoji-picker')
      ) {
        setIsFocused(false);
        setShowToolbar(false);
      }
    }, 300); // Increased delay for better stability with portals
  };

  // Calculate visual cursor position from raw text position
  const calculateVisualCursorPosition = useCallback(
    (rawPosition: number): { x: number; y: number } | null => {
      if (!overlayRef.current || !value) return null;

      try {
        // Create a range to measure visual position
        const range = document.createRange();
        const walker = document.createTreeWalker(
          overlayRef.current,
          NodeFilter.SHOW_TEXT
        );

        let currentRawPosition = 0;
        let currentNode;

        while ((currentNode = walker.nextNode())) {
          const textContent = currentNode.textContent || '';
          const parent = currentNode.parentElement;

          if (parent?.classList.contains('content-pill')) {
            // This is a pill - figure out its raw text length
            const remainingValue = value.slice(currentRawPosition);
            const hashtagMatch = remainingValue.match(/^#\w+/);
            const mentionMatch = remainingValue.match(/^@\[[^\]]+\]/);

            let rawPillLength = 0;
            if (hashtagMatch) {
              rawPillLength = hashtagMatch[0].length;
            } else if (mentionMatch) {
              rawPillLength = mentionMatch[0].length;
            } else {
              rawPillLength = textContent.length;
            }

            if (
              rawPosition >= currentRawPosition &&
              rawPosition <= currentRawPosition + rawPillLength
            ) {
              // Cursor is within this pill - position at the end of the visual pill
              range.selectNodeContents(parent);
              range.collapse(false); // Collapse to end
              const rect = range.getBoundingClientRect();
              const overlayRect = overlayRef.current.getBoundingClientRect();

              return {
                x: rect.right - overlayRect.left,
                y: rect.top - overlayRect.top + rect.height / 2
              };
            }

            currentRawPosition += rawPillLength;
          } else {
            // Regular text
            if (
              rawPosition >= currentRawPosition &&
              rawPosition <= currentRawPosition + textContent.length
            ) {
              // Cursor is within this text node
              const offsetInNode = rawPosition - currentRawPosition;
              range.setStart(currentNode, offsetInNode);
              range.setEnd(currentNode, offsetInNode);

              const rect = range.getBoundingClientRect();
              const overlayRect = overlayRef.current.getBoundingClientRect();

              return {
                x: rect.left - overlayRect.left,
                y: rect.top - overlayRect.top + rect.height / 2
              };
            }

            currentRawPosition += textContent.length;
          }
        }

        // If we're at the very end, position after the last content
        if (rawPosition >= value.length) {
          range.selectNodeContents(overlayRef.current);
          range.collapse(false);
          const rect = range.getBoundingClientRect();
          const overlayRect = overlayRef.current.getBoundingClientRect();

          return {
            x: rect.right - overlayRect.left,
            y: rect.top - overlayRect.top + rect.height / 2
          };
        }
      } catch (e) {
        // Fallback - position at the end
        if (overlayRef.current) {
          const overlayRect = overlayRef.current.getBoundingClientRect();
          return {
            x: overlayRect.width - 12,
            y: 20
          };
        }
      }

      return null;
    },
    [value]
  );

  // Update visual cursor when raw cursor changes
  const updateVisualCursor = useCallback(
    (newRawPosition: number) => {
      const visualPos = calculateVisualCursorPosition(newRawPosition);
      setVisualCursorPosition(visualPos);
    },
    [calculateVisualCursorPosition]
  );

  // Monitor cursor position changes in the hidden input with smart pill selection
  useEffect(() => {
    if (!smartInputRef.current) return;

    const input = smartInputRef.current;

    const handleSelectionChange = () => {
      if (document.activeElement === input) {
        const cursorPos = input.selectionStart || 0;
        const selectionEnd = input.selectionEnd || 0;

        // If there's a selection (not just cursor), check if we need to expand it for pills
        if (cursorPos !== selectionEnd) {
          const expanded = expandSelectionToPills(cursorPos, selectionEnd);
          if (expanded.start !== cursorPos || expanded.end !== selectionEnd) {
            // Need to expand selection to include full pills
            input.setSelectionRange(expanded.start, expanded.end);
            return; // This will trigger another selection change event
          }
        }

        updateVisualCursor(cursorPos);
      }
    };

    const handleMouseDown = () => {
      setIsSelecting(true);
      if (smartInputRef.current) {
        setSelectionStart(smartInputRef.current.selectionStart || 0);
      }
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
      setSelectionStart(null);
      handleSelectionChange();
    };

    const handleKeyDown = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      // Handle selection operations with smart pill expansion
      if (
        keyEvent.shiftKey &&
        (keyEvent.key === 'ArrowLeft' ||
          keyEvent.key === 'ArrowRight' ||
          keyEvent.key === 'Home' ||
          keyEvent.key === 'End')
      ) {
        // Let the default behavior happen first, then expand selection
        setTimeout(() => {
          if (document.activeElement === input) {
            const cursorPos = input.selectionStart || 0;
            const selectionEnd = input.selectionEnd || 0;

            if (cursorPos !== selectionEnd) {
              const expanded = expandSelectionToPills(cursorPos, selectionEnd);
              if (
                expanded.start !== cursorPos ||
                expanded.end !== selectionEnd
              ) {
                input.setSelectionRange(expanded.start, expanded.end);
              }
            }
          }
        }, 0);
      }
    };

    input.addEventListener('keyup', handleSelectionChange);
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('mouseup', handleMouseUp);
    input.addEventListener('mousedown', handleMouseDown);
    input.addEventListener('focus', handleSelectionChange);

    return () => {
      input.removeEventListener('keyup', handleSelectionChange);
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('mouseup', handleMouseUp);
      input.removeEventListener('mousedown', handleMouseDown);
      input.removeEventListener('focus', handleSelectionChange);
    };
  }, [updateVisualCursor, expandSelectionToPills]);

  // Handle clicks specifically on pill elements
  const handlePillClick = useCallback(
    (pillElement: Element): number => {
      if (!overlayRef.current || !value) return 0;

      // Get all pill elements in the overlay
      const allPills = Array.from(
        overlayRef.current.querySelectorAll('.content-pill')
      );
      const pillIndex = allPills.indexOf(pillElement);

      if (pillIndex === -1) return 0;

      // Parse the value to find pill positions
      let foundPills = 0;
      const pillRegex = /(#\w+)|(@\[[^\]]+\])/g;
      let match;

      while ((match = pillRegex.exec(value)) !== null) {
        if (foundPills === pillIndex) {
          // This is the pill we clicked on
          const clickPosition = match.index;
          const pillLength = match[0].length;

          // Position cursor at the end of the pill for easier editing
          return clickPosition + pillLength;
        }
        foundPills++;
      }

      // If we couldn't find the pill, use fallback approach
      return 0;
    },
    [value]
  );

  // Enhanced text position calculation for non-pill clicks
  const calculateAccurateTextPosition = useCallback(
    (
      clickX: number,
      clickY: number,
      relativeX: number,
      relativeY: number
    ): number => {
      // Try browser APIs first for accurate positioning
      if (document.caretPositionFromPoint) {
        const caretPosition = document.caretPositionFromPoint(clickX, clickY);
        if (caretPosition && caretPosition.offsetNode) {
          return getTextPositionFromVisualNode(
            caretPosition.offsetNode,
            caretPosition.offset
          );
        }
      } else if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(clickX, clickY);
        if (range) {
          return getTextPositionFromVisualNode(
            range.startContainer,
            range.startOffset
          );
        }
      }

      // Fallback to measurement-based positioning
      return calculateFallbackPosition(relativeX, relativeY);
    },
    [value]
  );

  // Helper to map visual DOM nodes to raw text positions
  const getTextPositionFromVisualNode = useCallback(
    (node: Node, offset: number): number => {
      if (!overlayRef.current || !value) return 0;

      let textPosition = 0;
      let currentPillIndex = 0;

      // Create a list of pills from the raw text
      const rawPills: Array<{ start: number; end: number; content: string }> =
        [];
      const pillRegex = /(#\w+)|(@\[[^\]]+\])/g;
      let match;

      while ((match = pillRegex.exec(value)) !== null) {
        rawPills.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[0]
        });
      }

      // Walk through the visual DOM to find our position
      const walker = document.createTreeWalker(
        overlayRef.current,
        NodeFilter.SHOW_ALL
      );

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        if (currentNode === node) {
          // Found our target node
          if (currentNode.nodeType === Node.TEXT_NODE) {
            return textPosition + offset;
          } else {
            return textPosition;
          }
        }

        if (currentNode.nodeType === Node.TEXT_NODE) {
          const textContent = currentNode.textContent || '';
          const parent = currentNode.parentElement;

          if (parent?.classList.contains('content-pill')) {
            // This text is inside a pill - map to the raw pill
            if (currentPillIndex < rawPills.length) {
              const rawPill = rawPills[currentPillIndex];
              textPosition = rawPill.end; // Move to end of raw pill
              currentPillIndex++;
            } else {
              // Fallback if pills don't match
              textPosition += textContent.length;
            }
          } else {
            // Regular text
            textPosition += textContent.length;
          }
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode as Element;
          if (element.classList.contains('content-pill')) {
            // Skip - we'll handle this when we hit the text inside
          }
        }
      }

      return Math.min(textPosition, value.length);
    },
    [value]
  );

  // Advanced cursor position mapping that accounts for pills and visual content
  const mapVisualPositionToTextPosition = useCallback(
    (clickX: number, clickY: number): number => {
      if (!overlayRef.current || !value) return value.length;

      const overlay = overlayRef.current;
      const rect = overlay.getBoundingClientRect();
      const relativeX = clickX - rect.left;
      const relativeY = clickY - rect.top;

      // Boundary checks
      if (relativeX < 0 || relativeY < 0) return 0;
      if (relativeX > rect.width || relativeY > rect.height)
        return value.length;

      try {
        // First, check if we clicked directly on a pill
        const clickedElement = document.elementFromPoint(clickX, clickY);
        if (clickedElement) {
          const pillElement = clickedElement.closest('.content-pill');
          if (pillElement) {
            return handlePillClick(pillElement);
          }
        }

        // If not on a pill, use accurate text position mapping
        return calculateAccurateTextPosition(
          clickX,
          clickY,
          relativeX,
          relativeY
        );
      } catch (e) {
        // Fallback on any error
        return calculateFallbackPosition(relativeX, relativeY);
      }
    },
    [value, multiline]
  );

  // Helper function to get text position from DOM node
  const getTextPositionFromNode = (node: Node, offset: number): number => {
    if (!overlayRef.current || !value) return 0;

    // Walk through the overlay content to find the text position
    let textPosition = 0;
    const walker = document.createTreeWalker(
      overlayRef.current,
      NodeFilter.SHOW_TEXT
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === node) {
        return textPosition + offset;
      }

      // Add the length of this text node
      const textContent = currentNode.textContent || '';

      // Check if this text node corresponds to raw text or is part of a pill
      const parent = currentNode.parentElement;
      if (parent?.classList.contains('content-pill')) {
        // This is a pill - we need to find the corresponding raw text
        const pillText = parent.textContent || '';

        // Try to find the pill in the raw value
        const remainingValue = value.slice(textPosition);

        // Look for hashtag or mention patterns
        const hashtagMatch = remainingValue.match(/^#\w+/);
        const mentionMatch = remainingValue.match(/^@\[[^\]]+\]/);

        if (hashtagMatch && pillText.includes(hashtagMatch[0])) {
          textPosition += hashtagMatch[0].length;
        } else if (
          mentionMatch &&
          pillText.includes(mentionMatch[0].split('|')[0])
        ) {
          textPosition += mentionMatch[0].length;
        } else {
          // Fallback - add the visible text length
          textPosition += pillText.length;
        }
      } else {
        // Regular text
        textPosition += textContent.length;
      }
    }

    return textPosition;
  };

  // Fallback position calculation for browsers without caret positioning
  const calculateFallbackPosition = (
    relativeX: number,
    relativeY: number
  ): number => {
    if (multiline) {
      const lineHeight = 24; // More accurate line height
      const targetLine = Math.floor(relativeY / lineHeight);
      const lines = value.split('\n');

      if (targetLine >= lines.length) return value.length;
      if (targetLine < 0) return 0;

      // Get position at start of target line
      let lineStartPosition = 0;
      for (let i = 0; i < targetLine; i++) {
        lineStartPosition += lines[i].length + 1; // +1 for newline
      }

      // For the target line, we need to be smarter about character positioning
      const targetLineText = lines[targetLine];

      // Create a temporary element to measure text width more accurately
      const measurer = document.createElement('span');
      measurer.style.visibility = 'hidden';
      measurer.style.position = 'absolute';
      measurer.style.whiteSpace = 'nowrap';
      measurer.style.font = window.getComputedStyle(overlayRef.current!).font;
      document.body.appendChild(measurer);

      let bestPosition = 0;
      let minDistance = Infinity;

      // Test each character position to find the closest one
      for (let i = 0; i <= targetLineText.length; i++) {
        measurer.textContent = targetLineText.slice(0, i);
        const charX = measurer.offsetWidth + 12; // Add padding
        const distance = Math.abs(charX - relativeX);

        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = i;
        }
      }

      document.body.removeChild(measurer);
      return lineStartPosition + bestPosition;
    } else {
      // Single line - similar approach
      const measurer = document.createElement('span');
      measurer.style.visibility = 'hidden';
      measurer.style.position = 'absolute';
      measurer.style.whiteSpace = 'nowrap';
      measurer.style.font = window.getComputedStyle(overlayRef.current!).font;
      document.body.appendChild(measurer);

      let bestPosition = 0;
      let minDistance = Infinity;

      for (let i = 0; i <= value.length; i++) {
        measurer.textContent = value.slice(0, i);
        const charX = measurer.offsetWidth + 12; // Add padding
        const distance = Math.abs(charX - relativeX);

        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = i;
        }
      }

      document.body.removeChild(measurer);
      return bestPosition;
    }
  };

  // Handle clicks on the pill overlay with visual cursor and smart pill selection
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!smartInputRef.current) return;

    // Focus the input
    smartInputRef.current.focus();

    // Map visual click position to text cursor position
    const textPosition = mapVisualPositionToTextPosition(e.clientX, e.clientY);

    // Check if we clicked on a pill - if so, select the entire pill
    const pill = findPillAt(textPosition);
    if (pill) {
      // Select the entire pill
      setTimeout(() => {
        if (smartInputRef.current) {
          smartInputRef.current.setSelectionRange(pill.start, pill.end);
          updateVisualCursor(pill.start);
        }
      }, 0);
    } else {
      // Normal cursor positioning
      setTimeout(() => {
        if (smartInputRef.current) {
          smartInputRef.current.setSelectionRange(textPosition, textPosition);
          updateVisualCursor(textPosition);
        }
      }, 0);
    }
  };

  // Handle toolbar insertions - ROBUST version that handles ref issues
  const handleInsertAtCursor = (text: string) => {
    // Use a more robust approach to get the input element
    const getInputElement = () => {
      // First try the ref
      if (smartInputRef.current) {
        return smartInputRef.current;
      }

      // If ref is lost, try to find the input in the container
      if (containerRef.current) {
        const input = containerRef.current.querySelector('input, textarea') as
          | HTMLInputElement
          | HTMLTextAreaElement;
        if (input) {
          return input;
        }
      }

      return null;
    };

    const inputElement = getInputElement();

    if (!inputElement) {
      // If we still can't find the input, just append to the end
      const newValue = value + text;
      onChange(newValue);

      // Try to refocus after the DOM updates
      setTimeout(() => {
        const retryElement = getInputElement();
        if (retryElement) {
          retryElement.focus();
          const newPosition = newValue.length;
          try {
            retryElement.setSelectionRange(newPosition, newPosition);
          } catch (e) {
            // Ignore selection range errors
          }
        }
      }, 100);
      return;
    }

    // Try to get cursor position, fallback to end of text
    let cursorPosition = 0;
    try {
      // For transparent inputs, we need to be more careful about selection
      if (document.activeElement === inputElement) {
        cursorPosition = inputElement.selectionStart || 0;
      } else {
        // If input is not focused, default to end of text
        cursorPosition = value.length;
      }
    } catch (e) {
      cursorPosition = value.length;
    }

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const newValue = beforeCursor + text + afterCursor;
    const newCursorPosition = cursorPosition + text.length;

    // Update the value
    onChange(newValue);

    // Focus and set cursor position with proper timing and retries
    const setFocusAndCursor = (attempts = 0) => {
      const element = getInputElement();
      if (element && attempts < 3) {
        try {
          element.focus();
          element.setSelectionRange(newCursorPosition, newCursorPosition);
        } catch (e) {
          // If this fails, try again with a longer delay
          setTimeout(() => setFocusAndCursor(attempts + 1), 50);
        }
      }
    };

    setTimeout(() => setFocusAndCursor(), 50);
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

        {/* Custom visual cursor */}
        {visualCursorPosition && isFocused && (
          <div
            className="visual-cursor"
            style={{
              position: 'absolute',
              left: visualCursorPosition.x,
              top: visualCursorPosition.y - 10,
              width: '2px',
              height: '20px',
              backgroundColor: 'var(--brand-primary)',
              animation: 'cursor-blink 1s infinite',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
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
          caret-color: transparent !important; /* Hide native cursor */
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

        /* Custom cursor animation */
        @keyframes cursor-blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        .visual-cursor {
          position: absolute;
          width: 2px;
          height: 20px;
          background-color: var(--brand-primary);
          animation: cursor-blink 1s infinite;
          pointer-events: none;
          z-index: 10;
        }

        /* Enhanced pill selection visual feedback */
        .pill-overlay :global(.content-pill) {
          position: relative;
          transition: background-color 0.15s ease;
        }

        .pill-overlay :global(.content-pill:hover) {
          background-color: rgba(255, 107, 53, 0.1) !important;
          cursor: pointer;
        }

        /* Indicate that pills are selectable as atomic units */
        .pill-overlay :global(.content-pill::before) {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 1px solid transparent;
          border-radius: 4px;
          pointer-events: none;
          transition: border-color 0.15s ease;
        }

        .pill-overlay :global(.content-pill:hover::before) {
          border-color: rgba(255, 107, 53, 0.3);
        }
      `}</style>
    </div>
  );
};
