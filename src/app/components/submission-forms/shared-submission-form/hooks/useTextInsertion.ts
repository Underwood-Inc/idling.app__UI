import { useCallback } from 'react';
import { TextManipulator } from '../../../../../lib/utils/text-extraction';

interface UseTextInsertionProps {
  value: string;
  onChange: (value: string) => void;
  richInputRef?: React.RefObject<any>;
}

export function useTextInsertion({
  value,
  onChange,
  richInputRef
}: UseTextInsertionProps) {
  
  const insertAtCursor = useCallback(
    (text: string) => {
      if (richInputRef?.current?.insertText) {
        // Use the rich input's native insertText method for proper cursor positioning
        richInputRef.current.insertText(text);

        // Ensure focus is maintained
        setTimeout(() => {
          if (richInputRef.current?.focus) {
            richInputRef.current.focus();
          }
        }, 0);
      } else if (richInputRef?.current?.getState) {
        // Enhanced fallback: insert at current cursor position
        const currentState = richInputRef.current.getState();
        const currentText = currentState.rawText;
        const cursorPosition = currentState.cursorPosition.index;

        const result = TextManipulator.insertAtPosition(currentText, text, cursorPosition);

        onChange(result.newText);

        // Set cursor position after insertion using rich input's methods
        setTimeout(() => {
          if (richInputRef.current) {
            if (richInputRef.current.focus) {
              richInputRef.current.focus();
            }
            // Use setCursor method if available (preferred over setSelection)
            if (richInputRef.current.setCursor) {
              richInputRef.current.setCursor({ index: result.newCursorPosition });
            } else if (richInputRef.current.setCursorPosition) {
              richInputRef.current.setCursorPosition(result.newCursorPosition);
            } else if (richInputRef.current.setSelection) {
              richInputRef.current.setSelection({
                start: { index: result.newCursorPosition },
                end: { index: result.newCursorPosition },
                direction: 'none'
              });
            }
          }
        }, 0);
      } else {
        // Final fallback: append to current value
        onChange(value + text);

        // Try to focus the input
        setTimeout(() => {
          if (richInputRef?.current?.focus) {
            richInputRef.current.focus();
          }
        }, 0);
      }
    },
    [value, onChange, richInputRef]
  );

  const replaceTextRange = useCallback(
    (startPos: number, endPos: number, newText: string) => {
      const result = TextManipulator.replaceBetween(value, newText, startPos, endPos);
      onChange(result.newText);

      // Set cursor position after replacement
      setTimeout(() => {
        if (richInputRef?.current) {
          if (richInputRef.current.focus) {
            richInputRef.current.focus();
          }
          if (richInputRef.current.setCursor) {
            richInputRef.current.setCursor({ index: result.newCursorPosition });
          }
        }
      }, 0);

      return result;
    },
    [value, onChange, richInputRef]
  );

  return {
    insertAtCursor,
    replaceTextRange
  };
} 