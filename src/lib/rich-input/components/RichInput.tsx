/**
 * Main RichInput React component (Refactored)
 * Provides a fully simulated input/textarea with rich content support
 */

'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { RichInputEngine } from '../core/RichInputEngine';
import { useKeyboardHandlers } from '../hooks/useKeyboardHandlers';
import { useMouseHandlers } from '../hooks/useMouseHandlers';
import { defaultRenderer } from '../renderers/DefaultRenderer';
import type {
  RichContentParser,
  RichContentToken,
  RichInputAPI,
  RichInputConfig,
  RichInputEventHandlers,
  RichInputPosition,
  RichInputRange,
  RichInputRenderer,
  RichInputSelection,
  RichInputState
} from '../types';
import {
  calculateEnhancedCursorCoordinates,
  calculateEnhancedCursorPosition,
  calculateEnhancedSelectionCoordinates
} from '../utils/enhancedCursorPositioning';
import { richTextLogger } from '../utils/logger';
import './RichInput.css';
import { RichInputContent } from './RichInputContent';

export interface RichInputProps extends RichInputConfig {
  value?: string;
  onChange?: (value: string) => void;
  onStateChange?: (state: RichInputState) => void;

  // Event handlers
  handlers?: RichInputEventHandlers;

  // Custom renderer
  renderer?: RichInputRenderer;

  // HTML attributes
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  autoFocus?: boolean;
  tabIndex?: number;

  // Form integration
  required?: boolean;

  // Additional props
  children?: React.ReactNode;

  // Debugging
  enableDebugLogging?: boolean;
  contextId?: string;

  // Configuration
  config?: Partial<RichInputConfig>;
}

export interface RichInputRef extends RichInputAPI {
  getElement: () => HTMLDivElement | null;
  getNativeInput: () => HTMLInputElement | HTMLTextAreaElement | null;
}

/**
 * RichInput is the main component that renders the RichInput.
 * It is used to render the RichInput and to handle the selection and cursor positioning.
 * It is also used to render the placeholder and the custom children.
 * It is also used to render the tokens.
 * It is also used to render the selection highlights.
 */
export const RichInput = forwardRef<RichInputRef, RichInputProps>(
  (
    {
      value = '',
      onChange,
      onStateChange,
      handlers = {},
      renderer = defaultRenderer,
      id,
      name,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      autoFocus = false,
      tabIndex = 0,
      required = false,
      children,
      config = {},
      enableDebugLogging = process.env.NODE_ENV === 'development',
      contextId = '',
      multiline = false,
      placeholder,
      maxLength,
      disabled = false
    },
    ref
  ) => {
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<RichInputEngine | null>(null);

    // Create merged config that includes top-level props
    const mergedConfig = {
      multiline: multiline,
      placeholder: placeholder || config.placeholder,
      maxLength: maxLength || config.maxLength,
      disabled: disabled,
      ...config,
      styling: {
        ...config.styling,
        className: contextId || config.styling?.className
      }
    };

    // Engine and state
    const [state, setState] = useState<RichInputState>(() => {
      const engine = new RichInputEngine(mergedConfig);
      engineRef.current = engine;

      // Set up debug logging
      if (enableDebugLogging) {
        richTextLogger.enable();
        if (contextId) {
          richTextLogger.setContext(contextId);
        }
        richTextLogger.logInfo('RichInput component initialized', {
          contextId,
          config: mergedConfig,
          initialValue: value
        });
      }

      // Get initial state
      const initialState = engine.getState();

      // Set initial value if provided
      if (value) {
        engine.setState({ rawText: value });
      }

      // Subscribe to state changes
      const unsubscribe = engine.onStateChange((newState) => {
        setState(newState);

        // Call external handlers
        onChange?.(newState.rawText);
        onStateChange?.(newState);
        handlers.onChange?.(newState);

        // Maintain focus after state changes if we were focused
        if (newState.isFocused && containerRef.current) {
          setTimeout(() => {
            if (
              containerRef.current &&
              document.activeElement !== containerRef.current
            ) {
              containerRef.current.focus();
            }
          }, 0);
        }
      });

      return value ? engine.getState() : initialState;
    });

    // Cursor and selection tracking
    const [cursorCoordinates, setCursorCoordinates] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [cursorAtomicContext, setCursorAtomicContext] = useState<
      | {
          isNearAtomic: boolean;
          isOverAtomic: boolean;
          isAtomicBoundary: boolean;
          type: string;
          proximity?: 'immediate' | 'close' | 'near';
          distance?: number;
        }
      | undefined
    >(undefined);
    const [selectionCoordinates, setSelectionCoordinates] = useState<
      Array<{ x: number; y: number; width: number; height: number }>
    >([]);

    // Calculate cursor and selection coordinates
    useEffect(() => {
      if (!contentRef.current || !measureRef.current) return;

      // Calculate enhanced cursor coordinates with atomic context
      const enhancedCursorResult = calculateEnhancedCursorPosition(
        contentRef.current,
        state.rawText,
        state.cursorPosition.index,
        enableDebugLogging ? richTextLogger : undefined
      );

      if (enhancedCursorResult) {
        setCursorCoordinates({
          x: enhancedCursorResult.x,
          y: enhancedCursorResult.y
        });
        setCursorAtomicContext(enhancedCursorResult.atomicContext);
      } else {
        // Fallback to original calculation
        const cursorCoords = calculateEnhancedCursorCoordinates(
          state.cursorPosition,
          state.rawText,
          contentRef.current
        );
        setCursorCoordinates(cursorCoords);
        setCursorAtomicContext(undefined);
      }

      // Calculate selection coordinates using enhanced positioning
      const selectionCoords = calculateEnhancedSelectionCoordinates(
        state.selection,
        state.rawText,
        contentRef.current
      );
      setSelectionCoordinates(selectionCoords);
    }, [
      state.cursorPosition,
      state.selection,
      state.rawText,
      enableDebugLogging
    ]);

    // Auto focus
    useEffect(() => {
      if (autoFocus && containerRef.current) {
        containerRef.current.focus();
      }
    }, [autoFocus]);

    // Handle value prop changes
    useEffect(() => {
      if (engineRef.current && value !== undefined && value !== state.rawText) {
        engineRef.current.setState({ rawText: value });
      }
    }, [value, state.rawText]);

    // Event handlers using hooks with merged config
    const {
      handleClick,
      handleMouseDown,
      handleMouseUp,
      handleFocus,
      handleBlur
    } = useMouseHandlers(
      engineRef.current!,
      state,
      mergedConfig,
      handlers,
      containerRef
    );

    const { handleKeyDown, handlePaste } = useKeyboardHandlers(
      engineRef.current!,
      state,
      mergedConfig,
      handlers,
      containerRef
    );

    // Token handlers (simple stubs for now)
    const handleTokenClick = useCallback(
      (e: React.MouseEvent, token: RichContentToken) => {
        // Handle token click - could expand to show tooltip or edit
        if (enableDebugLogging) {
          // Get tokenized content for detailed analysis
          const { ContentParser } = require('../../utils/content-parsers');
          const tokenizedContent = ContentParser.tokenize(state.rawText);

          // Find the click position within the token
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          // Estimate character position within token (rough approximation)
          const avgCharWidth = 8; // Approximate character width
          const charOffsetInToken = Math.floor(clickX / avgCharWidth);
          const clickedCharIndex = Math.min(
            token.start + charOffsetInToken,
            token.end - 1
          );

          // Get character at clicked position
          const character = ContentParser.getCharacterAt(
            tokenizedContent,
            clickedCharIndex
          );

          // Get word containing the clicked character
          const word = ContentParser.getWordAt(
            tokenizedContent,
            clickedCharIndex
          );

          // Get line info for the clicked character
          const lineInfo = ContentParser.getLineInfo(
            tokenizedContent,
            clickedCharIndex
          );
          const lines = state.rawText.split('\n');
          const lineText = lines[lineInfo.lineNumber] || '';

          richTextLogger.logInfo('🎯 Token Click Debug', {
            token,
            clickEvent: {
              clientX: e.clientX,
              clientY: e.clientY,
              clickX,
              clickY,
              estimatedCharIndex: clickedCharIndex
            },
            clickedCharacter: character
              ? {
                  char: character.char,
                  index: character.index,
                  isWhitespace: character.isWhitespace,
                  isNewline: character.isNewline,
                  isPunctuation: character.isPunctuation
                }
              : null,
            containingWord: word
              ? {
                  text: word.word,
                  start: word.start,
                  end: word.end,
                  isWhitespace: word.isWhitespace,
                  charPositionInWord: clickedCharIndex - word.start
                }
              : null,
            containingLine: {
              lineNumber: lineInfo.lineNumber + 1, // 1-based for display
              lineStart: lineInfo.lineStart,
              lineEnd: lineInfo.lineEnd,
              columnIndex: lineInfo.columnIndex,
              lineText: lineText,
              charPositionInLine: clickedCharIndex - lineInfo.lineStart
            },
            tokenBoundaries: {
              start: token.start,
              end: token.end,
              startChar: state.rawText.charAt(token.start) || '(none)',
              endChar: state.rawText.charAt(token.end - 1) || '(none)',
              tokenText: state.rawText.slice(token.start, token.end),
              tokenLength: token.end - token.start
            },
            tokenContext: {
              contextText: state.rawText.slice(
                Math.max(0, token.start - 5),
                Math.min(state.rawText.length, token.end + 5)
              ),
              fullText: state.rawText
            }
          });
        }
      },
      [state.rawText, enableDebugLogging]
    );

    const handleTokenHover = useCallback(
      (token: RichContentToken) => {
        // Handle token hover - could show preview
        if (enableDebugLogging) {
          const cursorIndex = state.cursorPosition.index;
          const cursorChar = state.rawText.charAt(cursorIndex);

          richTextLogger.logInfo('Token hovered with cursor context', {
            token,
            cursorContext: {
              cursorPosition: cursorIndex,
              cursorChar: cursorChar || '(none)',
              cursorContext: state.rawText.slice(
                Math.max(0, cursorIndex - 3),
                cursorIndex + 3
              )
            }
          });
        }
      },
      [state.rawText, state.cursorPosition, enableDebugLogging]
    );

    // Create a content change handler for interactive elements like URL pill controls
    const handleContentChange = useCallback((newText: string) => {
      if (engineRef.current) {
        engineRef.current.setState({ rawText: newText });
      }
    }, []);

    // Create enhanced state with content change callback
    const enhancedState = {
      ...state,
      onContentChange: handleContentChange
    };

    // Imperative API
    useImperativeHandle(
      ref,
      () => ({
        // State management
        getState: () => engineRef.current!.getState(),
        setState: (state: Partial<RichInputState>) =>
          engineRef.current!.setState(state),

        // Text operations
        insertText: (text: string, position?: RichInputPosition) =>
          engineRef.current!.insertText(text, position),
        deleteText: (range: RichInputRange) =>
          engineRef.current!.deleteText(range),
        replaceText: (range: RichInputRange, newText: string) =>
          engineRef.current!.replaceText(range, newText),

        // Selection operations
        setSelection: (selection: RichInputSelection) =>
          engineRef.current!.setSelection(selection),
        selectAll: () => engineRef.current!.selectAll(),
        selectToken: (token: RichContentToken) =>
          engineRef.current!.selectToken(token),
        getSelectedText: () => engineRef.current!.getSelectedText(),

        // Cursor operations
        setCursor: (position: RichInputPosition) =>
          engineRef.current!.setCursor(position),
        moveCursor: (
          direction: 'left' | 'right' | 'up' | 'down',
          extend?: boolean
        ) => engineRef.current!.moveCursor(direction, extend),

        // History operations
        undo: () => engineRef.current!.undo(),
        redo: () => engineRef.current!.redo(),
        saveHistoryEntry: () => engineRef.current!.saveHistoryEntry(),

        // Parser operations
        reparse: () => engineRef.current!.reparse(),
        addParser: (parser: RichContentParser) =>
          engineRef.current!.addParser(parser),
        removeParser: (name: string) => engineRef.current!.removeParser(name),

        // Utility operations
        focus: () => engineRef.current!.focus(),
        blur: () => engineRef.current!.blur(),
        clear: () => engineRef.current!.clear(),
        isEmpty: () => engineRef.current!.isEmpty(),

        // Component-specific methods
        getElement: () => containerRef.current,
        getNativeInput: () => hiddenInputRef.current
      }),
      [state]
    );

    // Create hidden native input for form integration
    const createHiddenInput = useCallback(() => {
      const InputElement = mergedConfig.multiline ? 'textarea' : 'input';
      return (
        <InputElement
          ref={hiddenInputRef as any}
          className="rich-input-hidden-input"
          value={state.rawText}
          onChange={() => {}} // Controlled by RichInput
          name={name}
          id={id ? `${id}-hidden` : undefined}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
        />
      );
    }, [mergedConfig.multiline, state.rawText, name, id, required]);

    // Create measurement element
    const createMeasureElement = useCallback(() => {
      return (
        <div
          ref={measureRef}
          className={`rich-input-measure ${
            mergedConfig.multiline ? 'rich-input-measure--multiline' : ''
          }`}
          aria-hidden="true"
        />
      );
    }, [mergedConfig.multiline]);

    if (!state || !engineRef.current) {
      return (
        <div
          className={`rich-input rich-input--loading ${mergedConfig.styling?.className || ''}`}
          ref={containerRef}
        >
          Loading...
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`rich-input ${mergedConfig.multiline ? 'rich-input--multiline' : 'rich-input--single-line'} ${
          state.isFocused ? 'rich-input--focused' : ''
        } ${mergedConfig.styling?.className || ''}`}
        style={mergedConfig.styling?.style}
        tabIndex={tabIndex}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        role="textbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-multiline={mergedConfig.multiline}
        aria-readonly={mergedConfig.disabled}
        aria-required={required}
        data-testid="rich-input"
        data-rich-input-context={contextId}
      >
        {/* Hidden native input for form integration */}
        {createHiddenInput()}

        {/* Measurement element */}
        {createMeasureElement()}

        {/* Content layer */}
        <div className="rich-input__content" data-rich-content>
          <RichInputContent
            ref={contentRef}
            state={enhancedState}
            config={mergedConfig}
            renderer={renderer}
            cursorCoordinates={cursorCoordinates}
            cursorAtomicContext={cursorAtomicContext}
            selectionCoordinates={selectionCoordinates}
            onTokenClick={handleTokenClick}
            onTokenHover={handleTokenHover}
          >
            {children}
          </RichInputContent>
        </div>
      </div>
    );
  }
);

RichInput.displayName = 'RichInput';
