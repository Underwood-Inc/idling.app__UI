/**
 * Navigation utilities for rich input components
 * Handles word boundaries, cursor snapping, and smart navigation
 */

import { ContentParser } from '../../utils/content-parsers';
import type { RichInputPosition } from '../types';

/**
 * Smart cursor snapping that respects pill boundaries while allowing character-level precision
 */
export function smartCursorSnap(
  position: RichInputPosition,
  rawText: string,
  enablePillSnapping: boolean = true
): RichInputPosition {
  if (!enablePillSnapping) return position;

  try {
    const tokenizedContent = ContentParser.tokenize(rawText);

    // Check if cursor is inside a pill
    const pill = ContentParser.getPillAt(tokenizedContent, position.index);
    if (pill) {
      // Snap to nearest pill boundary
      const distanceToStart = position.index - pill.start;
      const distanceToEnd = pill.end - position.index;

      // Snap to the closer boundary
      return {
        index: distanceToStart <= distanceToEnd ? pill.start : pill.end
      };
    }

    return position;
  } catch (error) {
    console.warn('Error in smart cursor snapping:', error);
    return position;
  }
}

/**
 * Get word boundaries for enhanced navigation
 */
export function getWordBoundaries(
  position: RichInputPosition,
  rawText: string
): {
  previousWord: number;
  nextWord: number;
  currentWordStart: number;
  currentWordEnd: number;
} {
  try {
    const tokenizedContent = ContentParser.tokenize(rawText);

    const previousWord = ContentParser.getPreviousWordPosition(
      tokenizedContent,
      position.index
    );
    const nextWord = ContentParser.getNextWordPosition(
      tokenizedContent,
      position.index
    );

    const currentWord = ContentParser.getWordAt(
      tokenizedContent,
      position.index
    );
    const currentWordStart = currentWord?.start ?? position.index;
    const currentWordEnd = currentWord?.end ?? position.index;

    return {
      previousWord,
      nextWord,
      currentWordStart,
      currentWordEnd
    };
  } catch (error) {
    console.warn('Error getting word boundaries:', error);
    return {
      previousWord: 0,
      nextWord: rawText.length,
      currentWordStart: position.index,
      currentWordEnd: position.index
    };
  }
}

/**
 * Find the next newline position from a given index
 */
export function findNextNewline(rawText: string, fromIndex: number): number {
  const newlineIndex = rawText.indexOf('\n', fromIndex);
  return newlineIndex === -1 ? rawText.length : newlineIndex;
}

/**
 * Find the previous newline position from a given index
 */
export function findPreviousNewline(
  rawText: string,
  fromIndex: number
): number {
  const newlineIndex = rawText.lastIndexOf('\n', fromIndex - 1);
  return newlineIndex === -1 ? 0 : newlineIndex + 1;
}

/**
 * Get line boundaries for a given position
 */
export function getLineBoundaries(
  position: RichInputPosition,
  rawText: string
): {
  lineStart: number;
  lineEnd: number;
  lineNumber: number;
  totalLines: number;
} {
  const lineStart = findPreviousNewline(rawText, position.index);
  const lineEnd = findNextNewline(rawText, position.index);

  // Count lines up to current position
  const textBeforePosition = rawText.substring(0, position.index);
  const lineNumber = (textBeforePosition.match(/\n/g) || []).length;

  // Count total lines
  const totalLines = (rawText.match(/\n/g) || []).length + 1;

  return {
    lineStart,
    lineEnd,
    lineNumber,
    totalLines
  };
}

/**
 * Navigate to start of line
 */
export function navigateToLineStart(
  position: RichInputPosition,
  rawText: string
): RichInputPosition {
  const lineStart = findPreviousNewline(rawText, position.index);
  return { index: lineStart };
}

/**
 * Navigate to end of line
 */
export function navigateToLineEnd(
  position: RichInputPosition,
  rawText: string
): RichInputPosition {
  const lineEnd = findNextNewline(rawText, position.index);
  return { index: lineEnd };
}

/**
 * Navigate up one line while preserving column position
 * Enhanced to handle first line edge case
 */
export function navigateUpLine(
  position: RichInputPosition,
  rawText: string
): RichInputPosition {
  const currentLineStart = findPreviousNewline(rawText, position.index);
  const columnPosition = position.index - currentLineStart;

  if (currentLineStart === 0) {
    // Already at first line, move to very beginning (position 0)
    return { index: 0 };
  }

  const previousLineStart = findPreviousNewline(rawText, currentLineStart - 1);
  const previousLineEnd = currentLineStart - 1; // -1 to exclude the newline
  const previousLineLength = previousLineEnd - previousLineStart;

  // Position cursor at same column or end of line if shorter
  const targetColumn = Math.min(columnPosition, previousLineLength);
  return { index: previousLineStart + targetColumn };
}

/**
 * Navigate down one line while preserving column position
 * Enhanced to handle last line edge case
 */
export function navigateDownLine(
  position: RichInputPosition,
  rawText: string
): RichInputPosition {
  const currentLineStart = findPreviousNewline(rawText, position.index);
  const columnPosition = position.index - currentLineStart;

  const nextLineStart = findNextNewline(rawText, position.index);
  if (nextLineStart >= rawText.length) {
    // Already at last line, move to end of content (after last text or atomic group)
    return { index: findLastTextPosition(rawText) };
  }

  const nextLineEnd = findNextNewline(rawText, nextLineStart + 1);
  const nextLineLength = nextLineEnd - (nextLineStart + 1);

  // Position cursor at same column or end of line if shorter
  const targetColumn = Math.min(columnPosition, nextLineLength);
  return { index: nextLineStart + 1 + targetColumn };
}

/**
 * Find the last meaningful text position in the content
 * This includes text and atomic units (pills, images, etc.) but skips trailing whitespace
 */
export function findLastTextPosition(rawText: string): number {
  // Trim trailing whitespace to find the last meaningful content
  const trimmedText = rawText.trimEnd();
  return trimmedText.length;
}

/**
 * Find the end position of a specific line
 * Enhanced to handle atomic units properly
 */
export function findLineEndPosition(
  lineIndex: number,
  rawText: string
): number {
  const lines = rawText.split('\n');

  if (lineIndex >= lines.length) {
    return rawText.length;
  }

  // Calculate the start position of the target line
  let lineStartPosition = 0;
  for (let i = 0; i < lineIndex; i++) {
    lineStartPosition += lines[i].length + 1; // +1 for newline
  }

  // Find the end of the line (excluding trailing whitespace on that line)
  const lineText = lines[lineIndex];
  const trimmedLineText = lineText.trimEnd();

  return lineStartPosition + trimmedLineText.length;
}
