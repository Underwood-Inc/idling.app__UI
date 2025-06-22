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
