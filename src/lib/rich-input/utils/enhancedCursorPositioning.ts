/**
 * Enhanced cursor positioning system with token-aware character-level precision
 * Maps cursor positions to specific rendered tokens for accurate positioning
 */

import type { RichInputPosition } from '../types';
import {
  calculateEnhancedClickPosition,
  calculateTokenAwareClickPosition
} from './clickPositioning';
import {
  calculateCursorWithinToken,
  calculateEndOfContentPosition,
  calculateLineAwareCursorPosition,
  fallbackCursorPosition
} from './cursorCalculations';
import { RichTextLogger } from './logger';
import { getWordBoundaries, smartCursorSnap } from './navigationUtils';
import { calculateEnhancedSelectionCoordinates } from './selectionCalculations';
import { findTokenAtPosition } from './tokenPositioning';

/**
 * Calculate cursor coordinates with line-aware token precision
 * This combines line-based structure with token-level accuracy
 */
export function calculateEnhancedCursorCoordinates(
  position: RichInputPosition,
  rawText: string,
  contentElement: HTMLElement | null
): { x: number; y: number } | null {
  if (!contentElement || !rawText) return { x: 0, y: 0 };

  try {
    // Use the new line-aware cursor positioning system
    const cursorCoordinates = calculateLineAwareCursorPosition(
      position,
      contentElement,
      rawText
    );

    if (cursorCoordinates) {
      return cursorCoordinates;
    }

    // Fallback to token-based system for backward compatibility
    const tokenPosition = findTokenAtPosition(position.index, contentElement);

    if (!tokenPosition) {
      // Position is beyond all tokens - place cursor at end
      return calculateEndOfContentPosition(contentElement);
    }

    // Calculate cursor position within the specific token
    return calculateCursorWithinToken(tokenPosition, contentElement, rawText);
  } catch (error) {
    console.warn('Error in enhanced cursor positioning:', error);
    return fallbackCursorPosition(position, contentElement);
  }
}

export interface EnhancedCursorPosition {
  x: number;
  y: number;
  height: number;
  atomicContext?: {
    isNearAtomic: boolean;
    isOverAtomic: boolean;
    isAtomicBoundary: boolean;
    type: string;
  };
}

/**
 * Enhanced cursor positioning with atomic unit awareness
 */
export function calculateEnhancedCursorPosition(
  contentElement: HTMLElement,
  rawText: string,
  cursorIndex: number,
  logger?: RichTextLogger
): EnhancedCursorPosition {
  const position = { index: cursorIndex, line: 0, column: 0 };
  const lineAwarePosition = calculateLineAwareCursorPosition(
    position,
    contentElement,
    rawText
  );

  // Detect atomic context from DOM elements
  const atomicContext = detectAtomicContextFromDOM(
    contentElement,
    cursorIndex,
    logger
  );

  // Log atomic context if available
  if (logger && atomicContext.isNearAtomic && lineAwarePosition) {
    logger.logCursor({
      position: cursorIndex,
      coordinates: { x: lineAwarePosition.x, y: lineAwarePosition.y },
      character: {
        char: rawText[cursorIndex] || '',
        isWhitespace: /\s/.test(rawText[cursorIndex] || ''),
        isNewline: rawText[cursorIndex] === '\n'
      },
      nearbyPills: atomicContext.type
        ? [
            {
              type: atomicContext.type,
              text: atomicContext.type,
              distance: 0
            }
          ]
        : []
    });
  }

  return {
    x: lineAwarePosition?.x || 0,
    y: lineAwarePosition?.y || 0,
    height: 20, // Default height
    atomicContext
  };
}

/**
 * Detects atomic context (pills, images) from DOM elements
 */
function detectAtomicContextFromDOM(
  contentElement: HTMLElement,
  cursorIndex: number,
  logger?: RichTextLogger
): {
  isNearAtomic: boolean;
  isOverAtomic: boolean;
  isAtomicBoundary: boolean;
  type: string;
} {
  const proximityRange = 3;

  // Find all atomic elements (pills, images, etc.)
  const atomicElements = contentElement.querySelectorAll(
    '.content-pill, .rich-input-image, .emoji--custom, .rich-input-newline'
  );

  let isNearAtomic = false;
  let isOverAtomic = false;
  let isAtomicBoundary = false;
  let type = 'text';

  for (const element of atomicElements) {
    const tokenStart = parseInt(
      element.getAttribute('data-token-start') || '0'
    );
    const tokenEnd = parseInt(element.getAttribute('data-token-end') || '0');
    const tokenType = element.getAttribute('data-token-type') || 'unknown';

    // Check if cursor is over the atomic element
    if (cursorIndex >= tokenStart && cursorIndex <= tokenEnd) {
      isOverAtomic = true;
      type = tokenType;

      // Check if at exact boundary
      if (cursorIndex === tokenStart || cursorIndex === tokenEnd) {
        isAtomicBoundary = true;
      }
    }

    // Check if cursor is near the atomic element
    if (
      Math.abs(cursorIndex - tokenStart) <= proximityRange ||
      Math.abs(cursorIndex - tokenEnd) <= proximityRange
    ) {
      isNearAtomic = true;
      if (type === 'text') {
        type = tokenType;
      }
    }
  }

  if (logger && (isNearAtomic || isOverAtomic)) {
    logger.logInfo('Atomic context detected', {
      cursorIndex,
      isNearAtomic,
      isOverAtomic,
      isAtomicBoundary,
      type,
      atomicElementsCount: atomicElements.length
    });
  }

  return {
    isNearAtomic,
    isOverAtomic,
    isAtomicBoundary,
    type
  };
}

// Re-export all the utility functions from the modular files
export {
  // Cursor calculations
  calculateCursorWithinToken,
  calculateEndOfContentPosition,
  // Click positioning
  calculateEnhancedClickPosition,
  // Selection calculations
  calculateEnhancedSelectionCoordinates,
  calculateLineAwareCursorPosition,
  calculateTokenAwareClickPosition,
  fallbackCursorPosition,
  // Token positioning
  findTokenAtPosition,
  getWordBoundaries,
  // Navigation utilities
  smartCursorSnap
};

// Re-export types
export type { TokenPosition } from './tokenPositioning';
