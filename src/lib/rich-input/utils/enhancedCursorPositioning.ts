/**
 * Enhanced cursor positioning system with token-aware character-level precision
 * Maps cursor positions to specific rendered tokens for accurate positioning
 */

import { ContentParser } from '../../utils/content-parsers';
import type {
  RichContentToken,
  RichInputPosition,
  RichInputSelection
} from '../types';
import { richTextLogger } from './logger';

export interface TokenPosition {
  tokenIndex: number;
  charOffsetInToken: number;
  token: RichContentToken;
}

/**
 * Calculate cursor coordinates with token-aware precision
 */
export function calculateEnhancedCursorCoordinates(
  position: RichInputPosition,
  rawText: string,
  contentElement: HTMLElement | null
): { x: number; y: number } | null {
  if (!contentElement || !rawText) return { x: 0, y: 0 };

  try {
    // Find the token and character offset for this position
    const tokenPosition = findTokenAtPosition(position.index, contentElement);

    if (!tokenPosition) {
      // Position is beyond all tokens - place cursor at end
      return calculateEndOfContentPosition(contentElement);
    }

    // Calculate cursor position within the specific token
    return calculateCursorWithinToken(tokenPosition, contentElement);
  } catch (error) {
    console.warn('Error in enhanced cursor positioning:', error);
    return fallbackCursorPosition(position, contentElement);
  }
}

/**
 * Find which token contains the given text position
 */
function findTokenAtPosition(
  textIndex: number,
  contentElement: HTMLElement
): TokenPosition | null {
  const tokenElements = contentElement.querySelectorAll('[data-token-index]');

  richTextLogger.logInfo('Finding token for text index', {
    textIndex,
    totalTokens: tokenElements.length
  });

  for (let i = 0; i < tokenElements.length; i++) {
    const tokenElement = tokenElements[i] as HTMLElement;
    const tokenStart = parseInt(tokenElement.dataset.tokenStart || '0');
    const tokenEnd = parseInt(tokenElement.dataset.tokenEnd || '0');

    // Check if the text index falls within this token's bounds
    if (textIndex >= tokenStart && textIndex < tokenEnd) {
      // Found the token containing this position
      const charOffsetInToken = textIndex - tokenStart;

      // Create token object from DOM data
      const token: RichContentToken = {
        type: tokenElement.dataset.tokenType as any,
        content: tokenElement.dataset.tokenContent || '',
        rawText: tokenElement.textContent || '',
        start: tokenStart,
        end: tokenEnd
      };

      richTextLogger.logInfo('Found token for position', {
        textIndex,
        tokenIndex: i,
        charOffsetInToken,
        tokenBounds: `${tokenStart}-${tokenEnd}`,
        tokenContent: token.content
      });

      return {
        tokenIndex: i,
        charOffsetInToken,
        token
      };
    }
  }

  // If no exact match found, find the closest token
  let closestToken = null;
  let closestDistance = Infinity;

  for (let i = 0; i < tokenElements.length; i++) {
    const tokenElement = tokenElements[i] as HTMLElement;
    const tokenStart = parseInt(tokenElement.dataset.tokenStart || '0');
    const tokenEnd = parseInt(tokenElement.dataset.tokenEnd || '0');

    const distanceToStart = Math.abs(textIndex - tokenStart);
    const distanceToEnd = Math.abs(textIndex - tokenEnd);
    const distance = Math.min(distanceToStart, distanceToEnd);

    if (distance < closestDistance) {
      closestDistance = distance;

      // Create token object from DOM data
      const token: RichContentToken = {
        type: tokenElement.dataset.tokenType as any,
        content: tokenElement.dataset.tokenContent || '',
        rawText: tokenElement.textContent || '',
        start: tokenStart,
        end: tokenEnd
      };

      closestToken = {
        tokenIndex: i,
        charOffsetInToken: textIndex <= tokenStart ? 0 : tokenEnd - tokenStart,
        token
      };
    }
  }

  if (closestToken) {
    richTextLogger.logInfo('Using closest token for position', {
      textIndex,
      tokenIndex: closestToken.tokenIndex,
      charOffsetInToken: closestToken.charOffsetInToken,
      tokenBounds: `${closestToken.token.start}-${closestToken.token.end}`,
      distance: closestDistance
    });
  }

  return closestToken;
}

/**
 * Calculate cursor position within a specific token
 */
function calculateCursorWithinToken(
  tokenPosition: TokenPosition,
  contentElement: HTMLElement
): { x: number; y: number } | null {
  const tokenElements = contentElement.querySelectorAll('[data-token-index]');
  const tokenElement = tokenElements[tokenPosition.tokenIndex] as HTMLElement;

  if (!tokenElement) return null;

  const tokenRect = tokenElement.getBoundingClientRect();
  const containerRect = contentElement.getBoundingClientRect();

  // For whitespace tokens, position cursor at the beginning
  if (tokenPosition.token.metadata?.isWhitespace) {
    return {
      x: tokenRect.left - containerRect.left,
      y: tokenRect.top - containerRect.top
    };
  }

  // For non-whitespace tokens, calculate precise character position
  try {
    // Create a range to measure character position
    const range = document.createRange();
    const textNode = getFirstTextNode(tokenElement);

    if (!textNode) {
      // Fallback to token boundaries
      return {
        x: tokenRect.left - containerRect.left,
        y: tokenRect.top - containerRect.top
      };
    }

    // Position range at the specific character offset
    const charOffset = Math.min(
      tokenPosition.charOffsetInToken,
      textNode.textContent?.length || 0
    );
    range.setStart(textNode, charOffset);
    range.collapse(true);

    const rangeRect = range.getBoundingClientRect();

    richTextLogger.logInfo('Calculated cursor position within token', {
      tokenIndex: tokenPosition.tokenIndex,
      charOffset: charOffset,
      tokenBounds: {
        left: tokenRect.left - containerRect.left,
        right: tokenRect.right - containerRect.left,
        width: tokenRect.width
      },
      cursorPosition: {
        x: rangeRect.left - containerRect.left,
        y: rangeRect.top - containerRect.top
      }
    });

    return {
      x: rangeRect.left - containerRect.left,
      y: rangeRect.top - containerRect.top
    };
  } catch (error) {
    console.warn('Error calculating cursor within token:', error);

    // Fallback to proportional positioning within token
    const tokenWidth = tokenRect.width;
    const tokenLength = tokenPosition.token.rawText.length;
    const proportionalX =
      tokenLength > 0
        ? (tokenPosition.charOffsetInToken / tokenLength) * tokenWidth
        : 0;

    return {
      x: tokenRect.left - containerRect.left + proportionalX,
      y: tokenRect.top - containerRect.top
    };
  }
}

/**
 * Get the first text node within an element
 */
function getFirstTextNode(element: HTMLElement): Text | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  return walker.nextNode() as Text | null;
}

/**
 * Calculate position at the end of all content
 */
function calculateEndOfContentPosition(contentElement: HTMLElement): {
  x: number;
  y: number;
} {
  const lastChild = contentElement.lastElementChild;

  if (lastChild) {
    const rect = lastChild.getBoundingClientRect();
    const containerRect = contentElement.getBoundingClientRect();

    return {
      x: rect.right - containerRect.left,
      y: rect.top - containerRect.top
    };
  }

  return { x: 0, y: 0 };
}

/**
 * Fallback cursor positioning for error cases
 */
function fallbackCursorPosition(
  position: RichInputPosition,
  contentElement: HTMLElement
): { x: number; y: number } {
  // Simple fallback: estimate position based on font metrics
  const computedStyle = window.getComputedStyle(contentElement);
  const fontSize = parseFloat(computedStyle.fontSize) || 14;
  const charWidth = fontSize * 0.6; // Rough estimate for monospace

  return {
    x: position.index * charWidth,
    y: 0
  };
}

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
function calculateSelectionWithinToken(
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
function calculatePartialSelectionInToken(
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

/**
 * Calculate click position with character-level precision
 * Uses a simpler coordinate-based approach that matches the working token click detection
 */
export function calculateEnhancedClickPosition(
  e: React.MouseEvent,
  rawText: string,
  contentElement: HTMLElement | null
): RichInputPosition | null {
  if (!contentElement) return null;

  try {
    const rect = contentElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    richTextLogger.logInfo('🔍 Simple Click Position Debug', {
      clickCoordinates: {
        globalX: e.clientX,
        globalY: e.clientY,
        relativeX: clickX,
        relativeY: clickY,
        contentRect: { width: rect.width, height: rect.height }
      }
    });

    // Find all token elements within the content element
    const tokenElements = contentElement.querySelectorAll('[data-token-start]');

    // Check each token element to see if the click is within it
    for (const tokenElement of tokenElements) {
      const tokenRect = tokenElement.getBoundingClientRect();
      const tokenRelativeRect = {
        left: tokenRect.left - rect.left,
        top: tokenRect.top - rect.top,
        right: tokenRect.right - rect.left,
        bottom: tokenRect.bottom - rect.top,
        width: tokenRect.width,
        height: tokenRect.height
      };

      // Check if click is within this token's bounds
      if (
        clickX >= tokenRelativeRect.left &&
        clickX <= tokenRelativeRect.right &&
        clickY >= tokenRelativeRect.top &&
        clickY <= tokenRelativeRect.bottom
      ) {
        // Get token boundaries from data attributes
        const tokenStart = parseInt(
          tokenElement.getAttribute('data-token-start') || '0'
        );
        const tokenEnd = parseInt(
          tokenElement.getAttribute('data-token-end') || '0'
        );

        // Calculate character position within token (same logic as token click handler)
        const clickXInToken = clickX - tokenRelativeRect.left;
        const avgCharWidth = 8; // Approximate character width
        const charOffsetInToken = Math.floor(clickXInToken / avgCharWidth);
        const clickedCharIndex = Math.min(
          tokenStart + charOffsetInToken,
          tokenEnd - 1
        );

        richTextLogger.logInfo('🎯 Found matching token for click', {
          tokenBounds: tokenRelativeRect,
          tokenStart,
          tokenEnd,
          clickXInToken,
          charOffsetInToken,
          clickedCharIndex,
          character: rawText.charAt(clickedCharIndex)
        });

        return {
          index: Math.max(0, Math.min(clickedCharIndex, rawText.length))
        };
      }
    }

    // If no token was clicked, fall back to simple coordinate estimation
    // This handles clicks in empty areas or between tokens
    const totalWidth = rect.width;
    const relativeX = Math.max(0, Math.min(clickX, totalWidth));
    const estimatedIndex = Math.round(
      (relativeX / totalWidth) * rawText.length
    );

    richTextLogger.logInfo('🔄 Using fallback coordinate estimation', {
      totalWidth,
      relativeX,
      estimatedIndex,
      rawTextLength: rawText.length
    });

    return { index: Math.max(0, Math.min(estimatedIndex, rawText.length)) };
  } catch (error) {
    richTextLogger.logInfo('❌ Error in simple click positioning', { error });
    return { index: 0 };
  }
}

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
 * Calculate cursor position from mouse click using token-aware system
 */
export function calculateTokenAwareClickPosition(
  e: React.MouseEvent,
  rawText: string,
  contentElement: HTMLElement
): RichInputPosition | null {
  if (!contentElement) return null;

  try {
    const rect = contentElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    richTextLogger.logInfo('Processing token-aware click', {
      clickCoordinates: `(${clickX}, ${clickY})`,
      contentElementBounds: {
        width: rect.width,
        height: rect.height
      }
    });

    // Find the token element that was clicked
    const tokenElements = contentElement.querySelectorAll('[data-token-index]');

    for (let i = 0; i < tokenElements.length; i++) {
      const tokenElement = tokenElements[i] as HTMLElement;
      const tokenRect = tokenElement.getBoundingClientRect();

      // Check if click is within this token's bounds
      if (
        clickX >= tokenRect.left - rect.left &&
        clickX <= tokenRect.right - rect.left &&
        clickY >= tokenRect.top - rect.top &&
        clickY <= tokenRect.bottom - rect.top
      ) {
        // Click is within this token
        const tokenStart = parseInt(tokenElement.dataset.tokenStart || '0');
        const tokenEnd = parseInt(tokenElement.dataset.tokenEnd || '0');
        const isWhitespace = tokenElement.dataset.isWhitespace === 'true';

        richTextLogger.logInfo('Found clicked token', {
          tokenIndex: i,
          tokenBounds: `${tokenStart}-${tokenEnd}`,
          isWhitespace,
          tokenType: tokenElement.dataset.tokenType,
          clickXInToken: clickX - (tokenRect.left - rect.left)
        });

        // For whitespace tokens, position cursor at the beginning
        if (isWhitespace) {
          return { index: tokenStart };
        }

        // For non-whitespace tokens, calculate precise character position
        const charPosition = calculateCharacterPositionInToken(
          clickX - (tokenRect.left - rect.left),
          tokenElement,
          tokenStart,
          tokenEnd
        );

        return { index: charPosition };
      }
    }

    // Click is outside all tokens - position at end
    richTextLogger.logInfo('Click outside all tokens, positioning at end');
    return { index: rawText.length };
  } catch (error) {
    console.warn('Error in token-aware click positioning:', error);
    return { index: 0 };
  }
}

/**
 * Calculate the character position within a token based on click X coordinate
 */
function calculateCharacterPositionInToken(
  clickXInToken: number,
  tokenElement: HTMLElement,
  tokenStart: number,
  tokenEnd: number
): number {
  try {
    const textNode = getFirstTextNode(tokenElement);
    if (!textNode || !textNode.textContent) {
      return tokenStart;
    }

    const tokenText = textNode.textContent;
    const tokenLength = tokenText.length;

    // Use browser's caretPositionFromPoint for precise positioning (if available)
    const documentWithCaret = document as any;
    if (documentWithCaret.caretPositionFromPoint) {
      try {
        const tokenRect = tokenElement.getBoundingClientRect();
        const absoluteX = tokenRect.left + clickXInToken;
        const absoluteY = tokenRect.top + tokenRect.height / 2;

        const caretPosition = documentWithCaret.caretPositionFromPoint(
          absoluteX,
          absoluteY
        );
        if (caretPosition && tokenElement.contains(caretPosition.offsetNode)) {
          const offset = caretPosition.offset;
          const charIndex = tokenStart + Math.min(offset, tokenLength);

          richTextLogger.logInfo('Calculated character position in token', {
            clickXInToken,
            caretOffset: offset,
            calculatedIndex: charIndex,
            tokenText:
              tokenText.substring(0, 20) + (tokenText.length > 20 ? '...' : '')
          });

          return charIndex;
        }
      } catch (error) {
        console.warn('Error using caretPositionFromPoint:', error);
        // Fall through to proportional positioning
      }
    }

    // Fallback: proportional positioning
    const tokenRect = tokenElement.getBoundingClientRect();
    const tokenWidth = tokenRect.width;
    const proportion = tokenWidth > 0 ? clickXInToken / tokenWidth : 0;
    const charOffset = Math.round(proportion * tokenLength);
    const charIndex = tokenStart + Math.min(charOffset, tokenLength);

    richTextLogger.logInfo('Used proportional positioning fallback', {
      clickXInToken,
      tokenWidth,
      proportion,
      charOffset,
      calculatedIndex: charIndex
    });

    return charIndex;
  } catch (error) {
    console.warn('Error calculating character position in token:', error);
    return tokenStart;
  }
}
