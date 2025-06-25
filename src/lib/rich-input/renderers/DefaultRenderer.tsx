/**
 * Default renderer for the rich input system
 * Provides basic rendering for all token types
 */

'use client';

import React from 'react';
import { URLPill } from '../../../app/components/ui/URLPill';
import {
  widthMeasurement,
  type MeasurementContext
} from '../core/WidthMeasurement';
import type {
  RichContentToken,
  RichInputPosition,
  RichInputRenderer,
  RichInputSelection,
  RichInputState
} from '../types';

export class DefaultRenderer implements RichInputRenderer {
  renderToken(
    token: RichContentToken,
    index: number,
    state: RichInputState
  ): React.ReactNode {
    switch (token.type) {
      case 'hashtag':
        return (
          <span
            key={`hashtag-${index}`}
            className="content-pill content-pill--hashtag content-pill--edit-mode"
            data-token-type="hashtag"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
          >
            #{token.content}
          </span>
        );

      case 'mention':
        return (
          <span
            key={`mention-${index}`}
            className="content-pill content-pill--mention content-pill--edit-mode"
            data-token-type="mention"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
            data-token-display-name={token.metadata?.displayName}
            data-token-user-id={token.metadata?.userId}
          >
            @{token.metadata?.displayName || token.content}
          </span>
        );

      case 'url': {
        const behavior = token.metadata?.behavior || 'link';
        const url = token.content;

        // Extract width from original format if available
        let width: 'small' | 'medium' | 'large' | 'full' = 'medium';
        if (token.metadata?.originalFormat) {
          const pillData = token.metadata.originalFormat.match(
            /!\[([^|]+)(?:\|([^|]+))?\]\([^)]+\)/
          );
          if (pillData && pillData[2]) {
            const extractedWidth = pillData[2].toLowerCase();
            if (
              ['s', 'm', 'l', 'f', 'small', 'medium', 'large', 'full'].includes(
                extractedWidth
              )
            ) {
              // Map legacy short names to full names
              switch (extractedWidth) {
                case 's':
                  width = 'small';
                  break;
                case 'm':
                  width = 'medium';
                  break;
                case 'l':
                  width = 'large';
                  break;
                case 'f':
                  width = 'full';
                  break;
                case 'small':
                case 'medium':
                case 'large':
                case 'full':
                  width = extractedWidth as
                    | 'small'
                    | 'medium'
                    | 'large'
                    | 'full';
                  break;
              }
            }
          }
        }

        // Create callback functions to update the raw text when URL pill controls are used
        const handleModeChange = (newBehavior: 'embed' | 'link' | 'modal') => {
          if (state.onContentChange) {
            const currentText = state.rawText;
            const tokenStart = token.start;
            const tokenEnd = token.end;

            // Create new pill format with updated behavior
            const newPillFormat = `![${newBehavior}](${url})`;

            // Replace the token in the raw text
            const newText =
              currentText.substring(0, tokenStart) +
              newPillFormat +
              currentText.substring(tokenEnd);

            // Update the content
            state.onContentChange(newText);
          }
        };

        const handleWidthChange = (
          newWidth: 'small' | 'medium' | 'large' | 'full'
        ) => {
          if (state.onContentChange) {
            const currentText = state.rawText;
            const tokenStart = token.start;
            const tokenEnd = token.end;

            // Create new pill format with updated width
            // Only include width parameter if it's not the default 'medium'
            const newPillFormat =
              newWidth === 'medium'
                ? `![${behavior}](${url})`
                : `![${behavior}|${newWidth}](${url})`;

            // Replace the token in the raw text
            const newText =
              currentText.substring(0, tokenStart) +
              newPillFormat +
              currentText.substring(tokenEnd);

            // Update the content
            state.onContentChange(newText);
          }
        };

        const handleRemove = () => {
          if (state.onContentChange) {
            const currentText = state.rawText;
            const tokenStart = token.start;
            const tokenEnd = token.end;

            // Remove the token from the raw text
            const newText =
              currentText.substring(0, tokenStart) +
              currentText.substring(tokenEnd);

            // Update the content
            state.onContentChange(newText);
          }
        };

        return (
          <URLPill
            key={`url-${index}`}
            url={url}
            behavior={behavior as 'embed' | 'link' | 'modal'}
            width={width}
            className="content-pill--url"
            isEditMode={true} // Enable full edit mode with controls
            onModeChange={handleModeChange}
            onWidthChange={handleWidthChange}
            onRemove={handleRemove}
          />
        );
      }

      case 'emoji':
        if (token.metadata?.emojiUnicode) {
          // Detect ASCII emojis and apply appropriate class
          const isAsciiEmoji =
            token.metadata?.customData?.unicode_codepoint === 'ASCII' ||
            token.content.includes('ascii') ||
            /^[()\\|\-_:;><3PDO*yn]/.test(token.metadata.emojiUnicode);

          const emojiClass = isAsciiEmoji
            ? 'emoji emoji--ascii'
            : 'emoji emoji--unicode';

          return (
            <span
              key={`emoji-${index}`}
              className={emojiClass}
              data-token-type="emoji"
              data-token-index={index}
              data-token-start={token.start}
              data-token-end={token.end}
              data-token-content={token.content}
            >
              {token.metadata.emojiUnicode}
            </span>
          );
        } else if (token.metadata?.emojiImageUrl) {
          return (
            <img
              key={`emoji-${index}`}
              src={token.metadata.emojiImageUrl}
              alt={`:${token.content}:`}
              className="emoji emoji--custom"
              data-token-type="emoji"
              data-token-index={index}
              data-token-start={token.start}
              data-token-end={token.end}
              data-token-content={token.content}
              style={{
                width: '1.2em',
                height: '1.2em',
                verticalAlign: 'middle',
                objectFit: 'contain'
              }}
            />
          );
        }
        return (
          <span
            key={`emoji-${index}`}
            className="emoji"
            data-token-type="emoji"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
          >
            {token.rawText}
          </span>
        );

      case 'image':
        return (
          <img
            key={`image-${index}`}
            src={token.content}
            alt={token.metadata?.imageAlt || 'Pasted image'}
            className="rich-input-image"
            data-token-type="image"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              verticalAlign: 'middle',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        );

      case 'text':
      default:
        // Handle dummy tokens specially for empty state cursor positioning
        if (token.metadata?.isDummy) {
          return (
            <span
              key={`dummy-${index}`}
              className="rich-input-dummy"
              data-token-type="text"
              data-token-index={index}
              data-token-start={token.start}
              data-token-end={token.end}
              data-token-content={token.content}
              data-is-dummy="true"
              data-is-whitespace="false"
              data-is-newline="false"
              data-has-newlines="false"
              style={{
                display: 'inline',
                width: 0,
                height: '1em',
                position: 'relative'
              }}
            >
              {/* Invisible character for cursor positioning */}
              <span style={{ opacity: 0, fontSize: 0, lineHeight: 0 }}>
                &nbsp;
              </span>
            </span>
          );
        }

        // Handle whitespace tokens specially for proper rendering
        if (token.metadata?.isWhitespace) {
          return (
            <span
              key={`whitespace-${index}`}
              className="rich-input-whitespace"
              data-token-type="text"
              data-token-index={index}
              data-token-start={token.start}
              data-token-end={token.end}
              data-token-content={token.content}
              data-is-whitespace="true"
              data-is-newline="false"
              data-has-newlines={token.metadata?.hasNewlines ? 'true' : 'false'}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {token.rawText}
            </span>
          );
        }

        // Handle newline tokens specially - render as line breaks
        if (token.metadata?.isNewline) {
          return (
            <span
              key={`newline-${index}`}
              className="rich-input-newline"
              data-token-type="text"
              data-token-index={index}
              data-token-start={token.start}
              data-token-end={token.end}
              data-token-content={token.content}
              data-is-newline="true"
              data-is-whitespace="true"
              data-has-newlines="false"
            >
              <br />
            </span>
          );
        }

        // Regular text tokens
        return (
          <span
            key={`text-${index}`}
            data-token-type="text"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
            data-is-whitespace="false"
            data-is-newline="false"
            data-has-newlines="false"
          >
            {token.rawText}
          </span>
        );
    }
  }

  renderCursor(
    position: RichInputPosition,
    state: RichInputState
  ): React.ReactNode {
    if (!state.isFocused) return null;

    // Detect if cursor is near or over atomic units (pills, images, etc.)
    const atomicContext = this.detectAtomicContext(position, state);

    // Build CSS classes based on atomic context with proximity levels
    let cursorClasses = 'rich-input-cursor';

    if (atomicContext.isNearAtomic) {
      cursorClasses += ' rich-input-cursor--near-atomic';

      // Add proximity-specific classes for progressive orange intensity
      if (atomicContext.proximity === 'immediate') {
        cursorClasses += ' rich-input-cursor--immediate';
      } else if (atomicContext.proximity === 'close') {
        cursorClasses += ' rich-input-cursor--close';
      } else if (atomicContext.proximity === 'near') {
        cursorClasses += ' rich-input-cursor--far';
      }
    }

    if (atomicContext.isOverAtomic) {
      cursorClasses += ' rich-input-cursor--over-atomic';
    }

    if (atomicContext.isAtomicBoundary) {
      cursorClasses += ' rich-input-cursor--atomic';
    }

    return (
      <span
        className={cursorClasses}
        data-cursor-index={position.index}
        data-cursor-line={position.line}
        data-cursor-column={position.column}
        data-atomic-context={atomicContext.type}
        data-atomic-proximity={atomicContext.proximity || 'none'}
        data-atomic-distance={atomicContext.distance || 0}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 15
        }}
      />
    );
  }

  /**
   * Detects if cursor is near, over, or at the boundary of atomic units
   */
  private detectAtomicContext(
    position: RichInputPosition,
    state: RichInputState
  ): {
    isNearAtomic: boolean;
    isOverAtomic: boolean;
    isAtomicBoundary: boolean;
    type: string;
    proximity?: 'immediate' | 'close' | 'near';
    distance?: number;
    atomicToken?: RichContentToken;
  } {
    const { tokens } = state;
    const proximityRange = 3; // Characters to consider "near"

    // Find atomic tokens (non-text tokens or newlines)
    const atomicTokens = tokens.filter(
      (token) => token.type !== 'text' || token.metadata?.isNewline
    );

    // Check if cursor is directly over an atomic token
    const overAtomicToken = atomicTokens.find(
      (token) => position.index >= token.start && position.index <= token.end
    );

    // Check if cursor is at the exact boundary of an atomic token
    const atBoundaryToken = atomicTokens.find(
      (token) => position.index === token.start || position.index === token.end
    );

    // Find the closest atomic token and calculate distance
    let nearAtomicToken: RichContentToken | undefined;
    let minDistance = Infinity;
    let proximity: 'immediate' | 'close' | 'near' | undefined;

    for (const token of atomicTokens) {
      const distanceToStart = Math.abs(position.index - token.start);
      const distanceToEnd = Math.abs(position.index - token.end);
      const distance = Math.min(distanceToStart, distanceToEnd);

      if (distance <= proximityRange && distance < minDistance) {
        nearAtomicToken = token;
        minDistance = distance;

        // Determine proximity level
        if (distance === 0) {
          proximity = 'immediate';
        } else if (distance === 1) {
          proximity = 'close';
        } else {
          proximity = 'near';
        }
      }
    }

    // Determine atomic context type
    let type = 'text';
    const relevantToken = overAtomicToken || atBoundaryToken || nearAtomicToken;
    if (relevantToken) {
      if (relevantToken.metadata?.isNewline) {
        type = 'newline';
      } else {
        type = relevantToken.type; // hashtag, mention, url, emoji, etc.
      }
    }

    return {
      isNearAtomic: !!nearAtomicToken,
      isOverAtomic: !!overAtomicToken,
      isAtomicBoundary: !!atBoundaryToken,
      type,
      proximity,
      distance: minDistance === Infinity ? undefined : minDistance,
      atomicToken: relevantToken
    };
  }

  renderSelection(
    selection: RichInputSelection,
    state: RichInputState
  ): React.ReactNode {
    if (!state.isFocused || selection.start.index === selection.end.index)
      return null;

    return (
      <span
        className="rich-input-selection"
        data-selection-start={selection.start.index}
        data-selection-end={selection.end.index}
        data-selection-direction={selection.direction}
        style={{
          position: 'absolute',
          backgroundColor: 'var(--selection-color, rgba(0, 123, 255, 0.25))',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />
    );
  }

  renderPlaceholder(
    placeholder: string,
    state: RichInputState
  ): React.ReactNode {
    if (state.rawText.length > 0 || state.isFocused) return null;

    return (
      <span
        className="rich-input-placeholder"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          color: 'var(--placeholder-color, #999)',
          fontStyle: 'italic',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: state.isMultiline ? 'pre-wrap' : 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: 'inherit',
          padding: 'inherit',
          fontSize: 'inherit',
          fontFamily: 'inherit'
        }}
      >
        {placeholder}
      </span>
    );
  }

  private renderMarkdownToken(
    token: RichContentToken,
    key: string
  ): React.ReactNode {
    const markdownType = token.metadata?.markdownType;

    switch (markdownType) {
      case 'bold':
        return (
          <strong
            key={key}
            className="rich-input-token rich-input-token--markdown rich-input-token--bold"
            data-token-type="markdown"
            data-markdown-type="bold"
            data-token-start={token.start}
            data-token-end={token.end}
          >
            {token.content}
          </strong>
        );

      case 'italic':
        return (
          <em
            key={key}
            className="rich-input-token rich-input-token--markdown rich-input-token--italic"
            data-token-type="markdown"
            data-markdown-type="italic"
            data-token-start={token.start}
            data-token-end={token.end}
          >
            {token.content}
          </em>
        );

      case 'code':
        return (
          <code
            key={key}
            className="rich-input-token rich-input-token--markdown rich-input-token--code"
            data-token-type="markdown"
            data-markdown-type="code"
            data-token-start={token.start}
            data-token-end={token.end}
          >
            {token.content}
          </code>
        );

      case 'link':
        return (
          <a
            key={key}
            className="rich-input-token rich-input-token--markdown rich-input-token--link"
            href={token.metadata?.href || '#'}
            data-token-type="markdown"
            data-markdown-type="link"
            data-token-start={token.start}
            data-token-end={token.end}
            target="_blank"
            rel="noopener noreferrer"
          >
            {token.content}
          </a>
        );

      default:
        return (
          <span
            key={key}
            className="rich-input-token rich-input-token--markdown"
            data-token-type="markdown"
            data-markdown-type={markdownType}
            data-token-start={token.start}
            data-token-end={token.end}
          >
            {token.content}
          </span>
        );
    }
  }

  /**
   * Measure the width of a token using the measurement utility
   */
  measureTokenWidth(
    token: RichContentToken,
    context: MeasurementContext = {}
  ): number {
    return widthMeasurement.measureToken(token, context);
  }

  /**
   * Pre-render a token for measurements
   */
  preRenderToken(
    token: RichContentToken,
    context: MeasurementContext = {}
  ): HTMLElement {
    const element = document.createElement('span');

    // Apply base styles
    element.style.position = 'absolute';
    element.style.visibility = 'hidden';
    element.style.whiteSpace = 'nowrap';

    // Apply token-specific rendering
    switch (token.type) {
      case 'hashtag':
        element.className =
          'content-pill content-pill--hashtag content-pill--edit-mode';
        element.textContent = `#${token.content}`;
        break;

      case 'mention':
        element.className =
          'content-pill content-pill--mention content-pill--edit-mode';
        element.textContent = `@${token.metadata?.displayName || token.content}`;
        break;

      case 'url': {
        const behavior = token.metadata?.behavior || 'link';
        element.className = `content-pill content-pill--url content-pill--edit-mode content-pill--${behavior}`;
        element.textContent = token.content;
        break;
      }

      case 'emoji':
        if (token.metadata?.emojiUnicode) {
          // Detect ASCII emojis and apply appropriate class
          const isAsciiEmoji =
            token.metadata?.customData?.unicode_codepoint === 'ASCII' ||
            token.content.includes('ascii') ||
            /^[()\\|\-_:;><3PDO*yn]/.test(token.metadata.emojiUnicode);

          element.className = isAsciiEmoji
            ? 'emoji emoji--ascii'
            : 'emoji emoji--unicode';
          element.textContent = token.metadata.emojiUnicode;
        } else if (token.metadata?.emojiImageUrl) {
          element.className = 'emoji emoji--custom';
          const img = document.createElement('img');
          img.src = token.metadata.emojiImageUrl;
          img.alt = `:${token.content}:`;
          img.style.width = '1.2em';
          img.style.height = '1.2em';
          element.appendChild(img);
        } else {
          element.className = 'emoji';
          element.textContent = token.rawText;
        }
        break;

      default:
        element.className = 'rich-input-token rich-input-token--text';
        element.textContent = token.rawText;
        break;
    }

    // Apply additional context classes
    if (context.className) {
      element.className += ` ${context.className}`;
    }

    return element;
  }

  renderContent(
    tokens: RichContentToken[],
    state: RichInputState
  ): React.ReactNode {
    if (tokens.length === 0) {
      return null;
    }

    // For multiline mode, group tokens by lines and wrap in row elements
    if (state.isMultiline) {
      const lines: RichContentToken[][] = [];
      const linePositions: { start: number; end: number }[] = [];
      let currentLine: RichContentToken[] = [];
      let currentLineStart = 0;
      let currentTextPosition = 0;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'text' && token.metadata?.isNewline) {
          // End current line and start new one
          const lineEnd =
            currentLine.length > 0
              ? currentLine[currentLine.length - 1].end
              : currentLineStart;

          linePositions.push({
            start: currentLineStart,
            end: lineEnd
          });

          lines.push([...currentLine]);
          currentLine = [];

          // Next line starts after this newline token
          currentLineStart = token.end;
          currentTextPosition = token.end;
        } else {
          // Add token to current line
          currentLine.push(token);
          currentTextPosition = token.end;
        }
      }

      // Add the last line if it has content
      if (currentLine.length > 0) {
        linePositions.push({
          start: currentLineStart,
          end: currentLine[currentLine.length - 1].end
        });
        lines.push(currentLine);
      }

      // If no lines, create empty line for cursor positioning
      if (lines.length === 0) {
        lines.push([]);
        linePositions.push({ start: 0, end: 0 });
      }

      return (
        <>
          {lines.map((lineTokens, lineIndex) => {
            // Use the pre-calculated line boundaries
            const lineStart = linePositions[lineIndex]?.start || 0;
            const lineEnd = linePositions[lineIndex]?.end || lineStart;

            return (
              <div
                key={`line-${lineIndex}`}
                className="rich-input-line"
                data-line-index={lineIndex}
                data-line-token-count={lineTokens.length}
                data-line-start={lineStart}
                data-line-end={lineEnd}
              >
                {lineTokens.length === 0 ? (
                  // Empty line - render invisible character for cursor positioning
                  <span
                    className="rich-input-empty-line"
                    data-token-type="empty-line"
                    data-token-start={lineStart}
                    data-token-end={lineEnd}
                  >
                    &nbsp;
                  </span>
                ) : (
                  lineTokens.map((token, tokenIndex) =>
                    this.renderToken(token, tokenIndex, state)
                  )
                )}
              </div>
            );
          })}
        </>
      );
    }

    // For single-line mode, render tokens normally
    return tokens.map((token, index) => this.renderToken(token, index, state));
  }
}

// Export a default instance
export const defaultRenderer = new DefaultRenderer();
