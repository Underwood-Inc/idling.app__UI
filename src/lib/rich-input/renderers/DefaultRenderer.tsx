/**
 * Default renderer for the rich input system
 * Provides basic rendering for all token types
 */

import React from 'react';
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
        return (
          <span
            key={`url-${index}`}
            className={`content-pill content-pill--url content-pill--edit-mode content-pill--${behavior}`}
            data-token-type="url"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
            data-token-behavior={behavior}
          >
            {token.content}
          </span>
        );
      }

      case 'emoji':
        if (token.metadata?.emojiUnicode) {
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
              style={{ whiteSpace: 'pre' }}
            >
              {token.rawText}
            </span>
          );
        }

        return (
          <span
            key={`text-${index}`}
            data-token-type="text"
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
            data-token-content={token.content}
            data-is-whitespace="false"
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

    return (
      <span
        className="rich-input-cursor"
        data-cursor-index={position.index}
        data-cursor-line={position.line}
        data-cursor-column={position.column}
        style={{
          position: 'absolute',
          width: '2px',
          height: '1.2em',
          backgroundColor: 'var(--brand-primary, #333)',
          animation: 'rich-input-cursor-blink 1s infinite',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
    );
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
          color: 'var(--placeholder-color, #999)',
          fontStyle: 'italic',
          pointerEvents: 'none',
          userSelect: 'none'
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
        element.className = 'emoji';
        if (token.metadata?.emojiUnicode) {
          element.textContent = token.metadata.emojiUnicode;
        } else if (token.metadata?.emojiImageUrl) {
          const img = document.createElement('img');
          img.src = token.metadata.emojiImageUrl;
          img.alt = `:${token.content}:`;
          img.style.width = '1.2em';
          img.style.height = '1.2em';
          element.appendChild(img);
        } else {
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
}

// Export a default instance
export const defaultRenderer = new DefaultRenderer();
