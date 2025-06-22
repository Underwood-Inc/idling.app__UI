import { useCallback } from 'react';
import type { RichInputEngine } from '../core/RichInputEngine';
import type {
  RichInputConfig,
  RichInputEventHandlers,
  RichInputState
} from '../types';
import { getWordBoundaries } from '../utils/enhancedCursorPositioning';

export function useKeyboardHandlers(
  engine: RichInputEngine,
  state: RichInputState,
  config: RichInputConfig,
  handlers: RichInputEventHandlers,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Allow custom handlers to override default behavior
      const customResult = handlers.onKeyDown?.(e.nativeEvent, state);
      if (customResult === false) {
        e.preventDefault();
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey, altKey } = e;
      const cmdKey = ctrlKey || metaKey;

      switch (key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (cmdKey || altKey) {
            // Move to previous word using enhanced word boundaries
            const { previousWord } = getWordBoundaries(
              state.cursorPosition,
              state.rawText
            );
            engine.setCursor({ index: previousWord });
          } else {
            engine.moveCursor('left', shiftKey);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (cmdKey || altKey) {
            // Move to next word using enhanced word boundaries
            const { nextWord } = getWordBoundaries(
              state.cursorPosition,
              state.rawText
            );
            engine.setCursor({ index: nextWord });
          } else {
            engine.moveCursor('right', shiftKey);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          engine.moveCursor('up', shiftKey);
          break;

        case 'ArrowDown':
          e.preventDefault();
          engine.moveCursor('down', shiftKey);
          break;

        case 'Home':
          e.preventDefault();
          if (cmdKey) {
            // Move to beginning of document
            engine.setCursor({ index: 0 });
          } else {
            // Move to beginning of line
            const lineStart = getLineStart(state.cursorPosition, state.rawText);
            engine.setCursor({ index: lineStart });
          }
          break;

        case 'End':
          e.preventDefault();
          if (cmdKey) {
            // Move to end of document
            engine.setCursor({ index: state.rawText.length });
          } else {
            // Move to end of line
            const lineEnd = getLineEnd(state.cursorPosition, state.rawText);
            engine.setCursor({ index: lineEnd });
          }
          break;

        case 'Backspace':
          e.preventDefault();
          if (cmdKey || altKey) {
            // Delete previous word
            const { currentWordStart } = getWordBoundaries(
              state.cursorPosition,
              state.rawText
            );
            engine.deleteText({
              start: currentWordStart,
              end: state.cursorPosition.index
            });
          } else if (
            state.selection.start.index !== state.selection.end.index
          ) {
            // Delete selection
            engine.deleteText({
              start: Math.min(
                state.selection.start.index,
                state.selection.end.index
              ),
              end: Math.max(
                state.selection.start.index,
                state.selection.end.index
              )
            });
          } else if (state.cursorPosition.index > 0) {
            // Check if we're at the end of an atomic token (pill or newline)
            const atomicTokenBeforeCursor = findAtomicTokenAt(
              state.tokens,
              state.cursorPosition.index - 1
            );

            if (
              atomicTokenBeforeCursor &&
              atomicTokenBeforeCursor.end === state.cursorPosition.index
            ) {
              // Delete entire atomic token
              engine.deleteText({
                start: atomicTokenBeforeCursor.start,
                end: atomicTokenBeforeCursor.end
              });
            } else {
              // Delete single character
              engine.deleteText({
                start: state.cursorPosition.index - 1,
                end: state.cursorPosition.index
              });
            }
          }
          break;

        case 'Delete':
          e.preventDefault();
          if (cmdKey || altKey) {
            // Delete next word
            const { currentWordEnd } = getWordBoundaries(
              state.cursorPosition,
              state.rawText
            );
            engine.deleteText({
              start: state.cursorPosition.index,
              end: currentWordEnd
            });
          } else if (
            state.selection.start.index !== state.selection.end.index
          ) {
            // Delete selection
            engine.deleteText({
              start: Math.min(
                state.selection.start.index,
                state.selection.end.index
              ),
              end: Math.max(
                state.selection.start.index,
                state.selection.end.index
              )
            });
          } else if (state.cursorPosition.index < state.rawText.length) {
            // Check if we're at the start of an atomic token (pill or newline)
            const atomicTokenAtCursor = findAtomicTokenAt(
              state.tokens,
              state.cursorPosition.index
            );

            if (
              atomicTokenAtCursor &&
              atomicTokenAtCursor.start === state.cursorPosition.index
            ) {
              // Delete entire atomic token
              engine.deleteText({
                start: atomicTokenAtCursor.start,
                end: atomicTokenAtCursor.end
              });
            } else {
              // Delete single character
              engine.deleteText({
                start: state.cursorPosition.index,
                end: state.cursorPosition.index + 1
              });
            }
          }
          break;

        case 'Enter':
          if (!config.multiline) {
            // Single-line mode - prevent default and don't insert
            e.preventDefault();
            return;
          }
          e.preventDefault();
          engine.insertText('\n');
          break;

        case 'Tab': {
          e.preventDefault();
          // Insert tab or spaces based on config
          const tabString = config.behavior?.tabSize
            ? ' '.repeat(config.behavior.tabSize)
            : '\t';
          engine.insertText(tabString);
          break;
        }

        default:
          // Handle keyboard shortcuts first
          if (cmdKey) {
            switch (key) {
              case 'a':
                e.preventDefault();
                engine.selectAll();
                break;
              case 'z':
                if (!shiftKey) {
                  e.preventDefault();
                  engine.undo();
                } else {
                  e.preventDefault();
                  engine.redo();
                }
                break;
              case 'y':
                e.preventDefault();
                engine.redo();
                break;
            }
          } else if (!altKey && key.length === 1) {
            // Handle regular character input (including a, z, y when not Cmd+key)
            e.preventDefault();

            // If there's a selection, replace it
            if (state.selection.start.index !== state.selection.end.index) {
              engine.replaceText(
                {
                  start: Math.min(
                    state.selection.start.index,
                    state.selection.end.index
                  ),
                  end: Math.max(
                    state.selection.start.index,
                    state.selection.end.index
                  )
                },
                key
              );
            } else {
              engine.insertText(key);
            }
          }
          break;
      }
    },
    [engine, state, config, handlers]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const customResult = handlers.onPaste?.(e.nativeEvent, state);
      if (customResult === false) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const pastedText = e.clipboardData.getData('text/plain');

      if (pastedText) {
        // If there's a selection, replace it
        if (state.selection.start.index !== state.selection.end.index) {
          engine.replaceText(
            {
              start: Math.min(
                state.selection.start.index,
                state.selection.end.index
              ),
              end: Math.max(
                state.selection.start.index,
                state.selection.end.index
              )
            },
            pastedText
          );
        } else {
          engine.insertText(pastedText);
        }
      }
    },
    [engine, state, handlers]
  );

  return {
    handleKeyDown,
    handlePaste
  };
}

// Helper functions for line navigation
function getLineStart(position: { index: number }, text: string): number {
  const beforeCursor = text.slice(0, position.index);
  const lastNewlineIndex = beforeCursor.lastIndexOf('\n');
  return lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
}

function getLineEnd(position: { index: number }, text: string): number {
  const afterCursor = text.slice(position.index);
  const nextNewlineIndex = afterCursor.indexOf('\n');
  return nextNewlineIndex === -1
    ? text.length
    : position.index + nextNewlineIndex;
}

// Helper function to find atomic tokens (pills and newlines) at a position
function findAtomicTokenAt(tokens: any[], position: number): any | null {
  return (
    tokens.find(
      (token) =>
        (token.type !== 'text' || token.metadata?.isNewline) &&
        position >= token.start &&
        position < token.end
    ) || null
  );
}
