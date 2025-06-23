/**
 * Enhanced Tokenization Integration for RichInput
 * Bridges the enhanced ContentParser with the RichInput system
 */

import { ContentParser, TokenizedContent } from '../../utils/content-parsers';
import type { RichContentToken, RichContentTokenType } from '../types';

/**
 * Convert TokenizedContent to RichContentTokens for RichInput compatibility
 */
export function tokenizedContentToRichTokens(
  tokenizedContent: TokenizedContent
): RichContentToken[] {
  const tokens: RichContentToken[] = [];

  // Convert segments to rich tokens
  tokenizedContent.segments.forEach((segment, index) => {
    const token: RichContentToken = {
      type: segment.type as RichContentTokenType, // Cast to the expected type
      content: segment.value,
      rawText: segment.rawFormat || segment.value,
      start: segment.start || 0,
      end: segment.end || 0,
      metadata: {
        ...(segment.type === 'hashtag' && { hashtag: segment.value }),
        ...(segment.type === 'mention' && {
          username: segment.value,
          userId: segment.userId,
          displayName: segment.displayName,
          filterType: segment.filterType
        }),
        ...(segment.type === 'url' && {
          href: segment.value,
          behavior: segment.behavior as 'link' | 'embed' | 'modal',
          originalFormat: segment.rawFormat
        })
      }
    };

    tokens.push(token);
  });

  return tokens;
}

/**
 * Enhanced cursor positioning using tokenized content
 */
export function getEnhancedCursorPosition(
  tokenizedContent: TokenizedContent,
  clickX: number,
  clickY: number,
  containerElement: HTMLElement
): number {
  // Use character-level tokenization for precise positioning
  const characters = tokenizedContent.characters;

  // Find the closest character to the click position
  let closestIndex = 0;
  let minDistance = Infinity;

  characters.forEach((char, index) => {
    // Create a temporary range to measure character position
    const range = document.createRange();
    const textNode = findTextNodeAtIndex(containerElement, char.index);

    if (textNode) {
      range.setStart(textNode, char.index - getTextNodeStartIndex(textNode));
      range.setEnd(textNode, char.index - getTextNodeStartIndex(textNode) + 1);

      const rect = range.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(clickX - rect.left, 2) + Math.pow(clickY - rect.top, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    }
  });

  return closestIndex;
}

/**
 * Smart word navigation using enhanced tokenization
 */
export function getNextWordPosition(
  tokenizedContent: TokenizedContent,
  currentPosition: number,
  direction: 'forward' | 'backward' = 'forward'
): number {
  if (direction === 'forward') {
    return ContentParser.getNextWordPosition(tokenizedContent, currentPosition);
  } else {
    return ContentParser.getPreviousWordPosition(
      tokenizedContent,
      currentPosition
    );
  }
}

/**
 * Smart selection using pill boundaries
 */
export function getSmartSelection(
  tokenizedContent: TokenizedContent,
  startPosition: number,
  endPosition: number
): { start: number; end: number; type: 'character' | 'word' | 'pill' } {
  // Check if selection spans across pills
  const selectionInfo = ContentParser.getSelectionInfo(
    tokenizedContent,
    startPosition,
    endPosition
  );

  if (selectionInfo.selectedPills.length > 0) {
    // If we have complete pills, expand to include all pills
    const firstPill = selectionInfo.selectedPills[0];
    const lastPill =
      selectionInfo.selectedPills[selectionInfo.selectedPills.length - 1];

    return {
      start: firstPill.start,
      end: lastPill.end,
      type: 'pill'
    };
  }

  // Check if it's a word selection
  if (
    selectionInfo.selectedWords.length === 1 &&
    !selectionInfo.selectedWords[0].isWhitespace
  ) {
    const word = selectionInfo.selectedWords[0];
    return {
      start: word.start,
      end: word.end,
      type: 'word'
    };
  }

  // Default to character selection
  return {
    start: startPosition,
    end: endPosition,
    type: 'character'
  };
}

/**
 * Get context information at cursor position
 */
export function getCursorContext(
  tokenizedContent: TokenizedContent,
  position: number
): {
  character: (typeof tokenizedContent.characters)[0] | null;
  word: (typeof tokenizedContent.words)[0] | null;
  pill: (typeof tokenizedContent.pills)[0] | null;
  lineInfo: ReturnType<typeof ContentParser.getLineInfo>;
  isAtWordBoundary: boolean;
  isAtPillBoundary: boolean;
} {
  const character =
    ContentParser.getCharacterAt(tokenizedContent, position) || null;
  const word = ContentParser.getWordAt(tokenizedContent, position) || null;
  const pill = ContentParser.getPillAt(tokenizedContent, position) || null;
  const lineInfo = ContentParser.getLineInfo(tokenizedContent, position);

  // Check boundaries
  const isAtWordBoundary = word
    ? position === word.start || position === word.end
    : false;
  const isAtPillBoundary = pill
    ? position === pill.start || position === pill.end
    : false;

  return {
    character,
    word,
    pill,
    lineInfo,
    isAtWordBoundary,
    isAtPillBoundary
  };
}

/**
 * Enhanced text insertion that respects pill boundaries
 */
export function insertTextSmart(
  originalText: string,
  position: number,
  textToInsert: string
): { newText: string; newCursorPosition: number } {
  const tokenizedContent = ContentParser.tokenize(originalText);
  const context = getCursorContext(tokenizedContent, position);

  // If inserting inside a pill, we might want to replace the entire pill
  if (
    context.pill &&
    position > context.pill.start &&
    position < context.pill.end
  ) {
    // For now, just insert normally, but this could be enhanced
    // to provide smart pill editing behavior
  }

  const result = ContentParser.insertText(originalText, position, textToInsert);

  return {
    newText: result.newText,
    newCursorPosition: position + textToInsert.length
  };
}

/**
 * Helper functions for DOM traversal
 */
function findTextNodeAtIndex(
  container: HTMLElement,
  index: number
): Text | null {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentIndex = 0;
  let node = walker.nextNode() as Text;

  while (node) {
    const nodeLength = node.textContent?.length || 0;
    if (index >= currentIndex && index < currentIndex + nodeLength) {
      return node;
    }
    currentIndex += nodeLength;
    node = walker.nextNode() as Text;
  }

  return null;
}

function getTextNodeStartIndex(textNode: Text): number {
  let index = 0;
  let current = textNode.parentNode?.firstChild;

  while (current && current !== textNode) {
    if (current.nodeType === Node.TEXT_NODE) {
      index += current.textContent?.length || 0;
    }
    current = current.nextSibling;
  }

  return index;
}

/**
 * Export enhanced tokenization for use in RichInput components
 */
export { ContentParser, type TokenizedContent };
