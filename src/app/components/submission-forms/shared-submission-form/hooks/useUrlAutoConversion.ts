import { createURLPill, findDomainConfig } from '@lib/config/url-pills';
import { TextManipulator } from '@lib/utils/text-extraction';
import { useCallback } from 'react';

interface UseUrlAutoConversionProps {
  value: string;
  onChange: (value: string) => void;
  richInputRef?: React.RefObject<any>;
}

export function useUrlAutoConversion({
  value,
  onChange,
  richInputRef
}: UseUrlAutoConversionProps) {
  const handleValueChangeWithURLDetection = useCallback(
    (newValue: string, previousValue?: string) => {
      const prevValue = previousValue || value || '';
      if (newValue.length <= prevValue.length) {
        return newValue; // Don't convert on deletion
      }

      const textAdded = newValue.length - prevValue.length;
      const lastChar = newValue[newValue.length - 1];

      // Scenario 1: User typed a space or newline after URL
      const isSpaceOrNewlineTrigger =
        (lastChar === ' ' || lastChar === '\n') && textAdded === 1;

      // Scenario 2: User pasted content (significant text addition)
      const isPasteTrigger = textAdded > 5; // Arbitrary threshold for paste detection

      if (!isSpaceOrNewlineTrigger && !isPasteTrigger) {
        return newValue; // Only convert on space/newline or paste
      }

      // Get cursor position from rich input
      let cursorPosition = newValue.length;
      if (richInputRef?.current?.getState) {
        const state = richInputRef.current.getState();
        cursorPosition = state?.cursorPosition?.index || newValue.length;
      }

      let textToCheck: string;
      let searchEndIndex: number;

      if (isSpaceOrNewlineTrigger) {
        // For space/newline trigger, check the word before the trigger
        textToCheck = newValue.slice(0, cursorPosition - 1);
        searchEndIndex = cursorPosition - 1;
      } else {
        // For paste trigger, check all the newly added text
        textToCheck = newValue.slice(0, cursorPosition);
        searchEndIndex = cursorPosition;
      }

      // Find URLs in the text to check
      const words = textToCheck.split(/[\s\n]+/);
      const lastWord = words[words.length - 1];

      // Check if the last word is a URL
      if (lastWord) {
        const urlRegex = /^https?:\/\/[^\s<>"{}|\\^`[\]]+$/;
        const isURL = urlRegex.test(lastWord);

        if (isURL) {
          const url = lastWord;
          const domainConfig = findDomainConfig(url);

          if (domainConfig) {
            // Convert URL to structured pill format
            const pillFormat = createURLPill(url, domainConfig.defaultBehavior);

            // Find the URL position in the text
            const urlStartIndex = textToCheck.lastIndexOf(lastWord);
            const urlEndIndex = urlStartIndex + lastWord.length;

            let newContent: string;
            let newCursorPos: number;

            if (isSpaceOrNewlineTrigger) {
              // Keep the space/newline that triggered the conversion
              const result = TextManipulator.replaceBetween(
                newValue,
                pillFormat + lastChar,
                urlStartIndex,
                urlEndIndex + 1
              );
              newContent = result.newText;
              newCursorPos = result.newCursorPosition;
            } else {
              // For paste, just replace the URL
              const result = TextManipulator.replaceBetween(
                newValue,
                pillFormat,
                urlStartIndex,
                urlEndIndex
              );
              newContent = result.newText;
              newCursorPos = result.newCursorPosition;
            }

            // Update the content
            onChange(newContent);

            // Set cursor position after the pill using rich input API
            setTimeout(() => {
              if (richInputRef?.current) {
                richInputRef.current.setCursor?.({ index: newCursorPos });
                richInputRef.current.focus?.();
              }
            }, 0);

            return newContent;
          }
        }
      }

      return newValue;
    },
    [value, onChange, richInputRef]
  );

  return {
    handleValueChangeWithURLDetection
  };
}
