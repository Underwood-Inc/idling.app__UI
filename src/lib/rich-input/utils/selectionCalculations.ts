/**
 * Selection calculation utilities for rich input components
 * Handles multi-token selections and selection rendering coordinates
 */

import type { RichInputSelection } from '../types';
import { getFirstTextNode } from './cursorCalculations';
import { findTokenAtPosition, type TokenPosition } from './tokenPositioning';

/**
 * Calculate selection coordinates with token-aware multi-line support
 */
export function calculateEnhancedSelectionCoordinates(
  selection: RichInputSelection,
  rawText: string,
  contentElement: HTMLElement | null
): Array<{ x: number; y: number; width: number; height: number }> {
  if (!contentElement || selection.start.index === selection.end.index) {
    return [];
  }

  try {
    const startIndex = Math.min(selection.start.index, selection.end.index);
    const endIndex = Math.max(selection.start.index, selection.end.index);

    // Find start and end token positions
    const startTokenPos = findTokenAtPosition(startIndex, contentElement);
    const endTokenPos = findTokenAtPosition(endIndex, contentElement);

    if (!startTokenPos || !endTokenPos) return [];

    // Create selection rectangles across tokens
    const selectionRects: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    const containerRect = contentElement.getBoundingClientRect();

    // If selection is within a single token
    if (startTokenPos.tokenIndex === endTokenPos.tokenIndex) {
      const tokenElement = contentElement.querySelector(
        `[data-token-index="${startTokenPos.tokenIndex}"]`
      ) as HTMLElement;
      if (tokenElement) {
        const rect = calculateSelectionWithinToken(
          startTokenPos,
          endTokenPos,
          tokenElement
        );
        if (rect) {
          selectionRects.push({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height
          });
        }
      }
    } else {
      // Selection spans multiple tokens
      const tokenElements =
        contentElement.querySelectorAll('[data-token-index]');

      for (let i = startTokenPos.tokenIndex; i <= endTokenPos.tokenIndex; i++) {
        const tokenElement = tokenElements[i] as HTMLElement;
        if (!tokenElement) continue;

        const tokenRect = tokenElement.getBoundingClientRect();

        if (i === startTokenPos.tokenIndex) {
          // First token - partial selection from start position
          const rect = calculatePartialSelectionInToken(
            startTokenPos,
            tokenElement,
            'start'
          );
          if (rect) {
            selectionRects.push({
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height
            });
          }
        } else if (i === endTokenPos.tokenIndex) {
          // Last token - partial selection to end position
          const rect = calculatePartialSelectionInToken(
            endTokenPos,
            tokenElement,
            'end'
          );
          if (rect) {
            selectionRects.push({
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height
            });
          }
        } else {
          // Middle tokens - full selection
          selectionRects.push({
            x: tokenRect.left - containerRect.left,
            y: tokenRect.top - containerRect.top,
            width: tokenRect.width,
            height: tokenRect.height
          });
        }
      }
    }

    return selectionRects;
  } catch (error) {
    console.warn('Error calculating enhanced selection coordinates:', error);
    return [];
  }
}

/**
 * Calculate selection rectangle within a single token
 */
export function calculateSelectionWithinToken(
  startPos: TokenPosition,
  endPos: TokenPosition,
  tokenElement: HTMLElement
): DOMRect | null {
  try {
    const range = document.createRange();
    const textNode = getFirstTextNode(tokenElement);

    if (!textNode) return null;

    const startOffset = Math.min(
      startPos.charOffsetInToken,
      textNode.textContent?.length || 0
    );
    const endOffset = Math.min(
      endPos.charOffsetInToken,
      textNode.textContent?.length || 0
    );

    range.setStart(textNode, startOffset);
    range.setEnd(textNode, endOffset);

    return range.getBoundingClientRect();
  } catch (error) {
    console.warn('Error calculating selection within token:', error);
    return null;
  }
}

/**
 * Calculate partial selection in a token (from start or to end)
 */
export function calculatePartialSelectionInToken(
  tokenPos: TokenPosition,
  tokenElement: HTMLElement,
  type: 'start' | 'end'
): DOMRect | null {
  try {
    const range = document.createRange();
    const textNode = getFirstTextNode(tokenElement);

    if (!textNode) return null;

    const textLength = textNode.textContent?.length || 0;

    if (type === 'start') {
      // Select from character offset to end of token
      range.setStart(
        textNode,
        Math.min(tokenPos.charOffsetInToken, textLength)
      );
      range.setEnd(textNode, textLength);
    } else {
      // Select from start of token to character offset
      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(tokenPos.charOffsetInToken, textLength));
    }

    return range.getBoundingClientRect();
  } catch (error) {
    console.warn('Error calculating partial selection in token:', error);
    return null;
  }
}
