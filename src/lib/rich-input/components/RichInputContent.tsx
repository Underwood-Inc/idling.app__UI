import React from 'react';
import type {
  RichContentToken,
  RichInputConfig,
  RichInputRenderer,
  RichInputState
} from '../types';
import { RichInputCursor } from './RichInputCursor';
import { RichInputSelection } from './RichInputSelection';

interface RichInputContentProps {
  state: RichInputState;
  config: RichInputConfig;
  renderer: RichInputRenderer;
  cursorCoordinates: { x: number; y: number } | null;
  selectionCoordinates: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  onTokenClick: (e: React.MouseEvent, token: RichContentToken) => void;
  onTokenHover: (token: RichContentToken) => void;
  children?: React.ReactNode;
}

/**
 * RichInputContent is a component that renders the content of a RichInput.
 * It is used to render the content of a RichInput and to handle the selection and cursor positioning.
 * It is also used to render the placeholder and the custom children.
 * It is also used to render the tokens.
 * It is also used to render the selection highlights.
 */
export const RichInputContent = React.forwardRef<
  HTMLDivElement,
  RichInputContentProps
>(
  (
    {
      state,
      config,
      renderer,
      cursorCoordinates,
      selectionCoordinates,
      onTokenClick,
      onTokenHover,
      children
    },
    ref
  ) => {
    // Render tokens
    const renderTokens = () => {
      // Use the renderer's renderContent method if available (for line-based rendering)
      if (typeof renderer.renderContent === 'function') {
        return renderer.renderContent(state.tokens, state);
      }

      // Fallback to individual token rendering for backward compatibility
      return state.tokens.map((token, index) => {
        const renderedToken = renderer.renderToken(token, index, state);

        // For newline tokens, render directly without wrapper since they're <br /> elements
        if (token.metadata?.isNewline) {
          // Clone the rendered element to add event handlers and data attributes
          if (React.isValidElement(renderedToken)) {
            return React.cloneElement(
              renderedToken as React.ReactElement<any>,
              {
                key: `token-${index}-${token.start}-${token.end}`,
                onClick: (e: React.MouseEvent) => onTokenClick(e, token),
                onMouseEnter: () => onTokenHover(token),
                'data-token-index': index,
                'data-token-start': token.start,
                'data-token-end': token.end,
                // Preserve existing data attributes from renderer
                ...((renderedToken as React.ReactElement<any>).props || {})
              }
            );
          }

          // Fallback if not a valid React element
          return renderedToken;
        }

        // For other tokens, use positioned wrapper for cursor positioning
        return (
          <span
            key={`token-${index}-${token.start}-${token.end}`}
            onClick={(e) => onTokenClick(e, token)}
            onMouseEnter={() => onTokenHover(token)}
            style={{ position: 'relative' }}
            data-token-index={index}
            data-token-start={token.start}
            data-token-end={token.end}
          >
            {renderedToken}
          </span>
        );
      });
    };

    return (
      <div
        ref={ref}
        className={`rich-input-content ${
          config.multiline ? 'rich-input-content--multiline' : ''
        }`}
      >
        {/* Selection highlights */}
        <RichInputSelection coordinates={selectionCoordinates} />

        {/* Content tokens */}
        {state.tokens.length > 0 ? renderTokens() : null}

        {/* Placeholder */}
        {renderer.renderPlaceholder(config.placeholder || '', state)}

        {/* Cursor */}
        <RichInputCursor
          coordinates={cursorCoordinates}
          isFocused={state.isFocused}
        />

        {/* Custom children */}
        {children}
      </div>
    );
  }
);

RichInputContent.displayName = 'RichInputContent';
