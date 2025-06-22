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
      return state.tokens.map((token, index) => (
        <span
          key={`token-${index}-${token.start}-${token.end}`}
          onClick={(e) => onTokenClick(e, token)}
          onMouseEnter={() => onTokenHover(token)}
          style={{ position: 'relative' }}
          data-token-index={index}
          data-token-start={token.start}
          data-token-end={token.end}
        >
          {renderer.renderToken(token, index, state)}
        </span>
      ));
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
