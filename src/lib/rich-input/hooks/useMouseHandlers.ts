import { useCallback } from 'react';
import { ContentParser } from '../../utils/content-parsers';
import type { RichInputEngine } from '../core/RichInputEngine';
import type {
  RichInputConfig,
  RichInputEventHandlers,
  RichInputState
} from '../types';
import { calculateTokenAwareClickPosition } from '../utils/enhancedCursorPositioning';
import { richTextLogger, type ClickDebugInfo } from '../utils/logger';

export function useMouseHandlers(
  engine: RichInputEngine,
  state: RichInputState,
  config: RichInputConfig,
  handlers: RichInputEventHandlers,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const contentElement = containerRef.current?.querySelector(
        '[data-rich-content]'
      ) as HTMLElement;
      if (!contentElement) return;

      const position = calculateTokenAwareClickPosition(
        e,
        state.rawText,
        contentElement
      );

      if (position) {
        // Collect debug information
        const debugInfo = collectClickDebugInfo(
          e,
          position.index,
          state.rawText,
          contentElement
        );

        // Log the click for debugging
        richTextLogger.logClick(debugInfo);

        // Set cursor position
        engine.setCursor(position);
      }
    },
    [engine, state, containerRef]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Start selection if needed
    // This will be handled by the click handler for now
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // End selection if needed
    // This will be handled by the selection system
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent) => {
      engine.focus();
      handlers.onFocus?.(state);
    },
    [engine, handlers, state]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      engine.blur();
      handlers.onBlur?.(state);
    },
    [engine, handlers, state]
  );

  return {
    handleClick,
    handleMouseDown,
    handleMouseUp,
    handleFocus,
    handleBlur
  };
}

/**
 * Collect comprehensive debug information about a click event
 */
function collectClickDebugInfo(
  e: React.MouseEvent,
  textIndex: number,
  rawText: string,
  contentElement: HTMLElement
): ClickDebugInfo {
  const rect = contentElement.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Get tokenized content for detailed analysis
  const tokenizedContent = ContentParser.tokenize(rawText);

  // Get character at click position
  const character = ContentParser.getCharacterAt(tokenizedContent, textIndex);

  // Get word at click position
  const word = ContentParser.getWordAt(tokenizedContent, textIndex);
  let wordInfo: ClickDebugInfo['word'] | undefined;
  if (word) {
    wordInfo = {
      text: word.word,
      start: word.start,
      end: word.end,
      cursorPositionInWord: textIndex - word.start,
      isWhitespace: word.isWhitespace
    };
  }

  // Get line info (for multiline support)
  const lineInfo = ContentParser.getLineInfo(tokenizedContent, textIndex);
  const lines = rawText.split('\n');
  const lineText = lines[lineInfo.lineNumber] || '';

  const line: ClickDebugInfo['line'] = {
    lineNumber: lineInfo.lineNumber + 1, // 1-based for display
    lineStart: lineInfo.lineStart,
    lineEnd: lineInfo.lineEnd,
    columnIndex: lineInfo.columnIndex,
    lineText
  };

  // Get pill at click position
  const pill = ContentParser.getPillAt(tokenizedContent, textIndex);
  let pillInfo: ClickDebugInfo['pill'] | undefined;
  if (pill) {
    // Determine pill variant based on data
    let variant = 'default';
    if (pill.type === 'mention' && pill.data.filterType) {
      variant = pill.data.filterType;
    } else if (pill.type === 'url' && pill.data.behavior) {
      variant = pill.data.behavior;
    }

    pillInfo = {
      type: pill.type,
      variant,
      rawText: rawText.slice(pill.start, pill.end),
      displayText: pill.displayValue,
      start: pill.start,
      end: pill.end,
      data: pill.data
    };
  }

  return {
    clickX,
    clickY,
    textIndex,
    word: wordInfo,
    line,
    pill: pillInfo,
    character: character
      ? {
          char: character.char,
          isWhitespace: character.isWhitespace,
          isNewline: character.isNewline,
          isPunctuation: character.isPunctuation
        }
      : undefined,
    fullText: rawText,
    textLength: rawText.length
  };
}
