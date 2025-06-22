/**
 * Cursor calculation utilities for rich input components
 * Handles cursor positioning within tokens and coordinate calculations
 */

import type { RichInputPosition } from '../types';
import { richTextLogger } from './logger';
import type { TokenPosition } from './tokenPositioning';

/**
 * Calculate cursor position with line-aware system support
 * This combines line-based structure with token-level precision
 */
export function calculateLineAwareCursorPosition(
  position: RichInputPosition,
  contentElement: HTMLElement,
  rawText: string
): { x: number; y: number } | null {
  // Check if we have line-based structure (multiline mode)
  const lineElements = contentElement.querySelectorAll('.rich-input-line');

  if (lineElements.length > 0) {
    // Line-based rendering - find the correct line first, then position within tokens
    return calculateCursorInLineBasedStructure(
      position,
      contentElement,
      rawText,
      lineElements
    );
  } else {
    // Fallback to token-based positioning for single-line mode
    return calculateCursorInTokenBasedStructure(
      position,
      contentElement,
      rawText
    );
  }
}

/**
 * Calculate cursor position within line-based structure
 */
function calculateCursorInLineBasedStructure(
  position: RichInputPosition,
  contentElement: HTMLElement,
  rawText: string,
  lineElements: NodeListOf<Element>
): { x: number; y: number } | null {
  const containerRect = contentElement.getBoundingClientRect();
  const textIndex = position.index;

  richTextLogger.logInfo('🎯 Line-based cursor positioning', {
    textIndex,
    lineElementsCount: lineElements.length,
    containerRect: {
      width: containerRect.width,
      height: containerRect.height
    }
  });

  // Find which line contains this text index
  for (const lineElement of lineElements) {
    const lineStart = parseInt(
      lineElement.getAttribute('data-line-start') || '0'
    );
    const lineEnd = parseInt(lineElement.getAttribute('data-line-end') || '0');
    const lineIndex = parseInt(
      lineElement.getAttribute('data-line-index') || '0'
    );

    richTextLogger.logInfo('🔍 Checking line for cursor position', {
      lineIndex,
      lineStart,
      lineEnd,
      textIndex,
      isWithinLine: textIndex >= lineStart && textIndex <= lineEnd
    });

    // Check if cursor position is within this line's range
    if (textIndex >= lineStart && textIndex <= lineEnd) {
      const lineRect = lineElement.getBoundingClientRect();

      // If this is an empty line, position cursor at the beginning of the line
      const isEmptyLine =
        lineStart === lineEnd ||
        lineElement.querySelector('.rich-input-empty-line');

      if (isEmptyLine) {
        const cursorPosition = {
          x: lineRect.left - containerRect.left,
          y: lineRect.top - containerRect.top
        };

        richTextLogger.logInfo('📍 Positioning cursor on empty line', {
          lineIndex,
          lineStart,
          lineEnd,
          lineRect: {
            left: lineRect.left,
            top: lineRect.top,
            width: lineRect.width,
            height: lineRect.height
          },
          cursorPosition
        });

        return cursorPosition;
      }

      // Find tokens within this line
      const lineTokenElements =
        lineElement.querySelectorAll('[data-token-start]');

      // Check if this line contains only empty content tokens
      const hasOnlyEmptyTokens = Array.from(lineTokenElements).every(
        (tokenEl) => {
          const tokenStart = parseInt(
            tokenEl.getAttribute('data-token-start') || '0'
          );
          const tokenEnd = parseInt(
            tokenEl.getAttribute('data-token-end') || '0'
          );
          const tokenContent = rawText.substring(tokenStart, tokenEnd);
          return tokenContent.trim() === '';
        }
      );

      if (hasOnlyEmptyTokens && lineTokenElements.length > 0) {
        const cursorPosition = {
          x: lineRect.left - containerRect.left,
          y: lineRect.top - containerRect.top
        };

        richTextLogger.logInfo(
          '📍 Positioning cursor on line with only empty tokens',
          {
            lineIndex,
            lineStart,
            lineEnd,
            tokenCount: lineTokenElements.length,
            cursorPosition
          }
        );

        return cursorPosition;
      }

      richTextLogger.logInfo('🔍 Searching tokens within line', {
        lineIndex,
        tokenCount: lineTokenElements.length
      });

      for (const tokenElement of lineTokenElements) {
        const tokenStart = parseInt(
          tokenElement.getAttribute('data-token-start') || '0'
        );
        const tokenEnd = parseInt(
          tokenElement.getAttribute('data-token-end') || '0'
        );

        // Check if cursor is within this token
        if (textIndex >= tokenStart && textIndex <= tokenEnd) {
          const tokenRect = tokenElement.getBoundingClientRect();
          const charOffsetInToken = textIndex - tokenStart;

          // Calculate precise position within the token
          const tokenPosition = calculatePreciseCursorInToken(
            tokenElement as HTMLElement,
            charOffsetInToken,
            rawText.substring(tokenStart, tokenEnd)
          );

          if (tokenPosition) {
            const cursorPosition = {
              x: tokenPosition.x - containerRect.left,
              y: tokenPosition.y - containerRect.top
            };

            richTextLogger.logInfo('📍 Positioning cursor within token', {
              lineIndex,
              tokenStart,
              tokenEnd,
              charOffsetInToken,
              cursorPosition
            });

            return cursorPosition;
          }

          // Fallback to token start
          return {
            x: tokenRect.left - containerRect.left,
            y: tokenRect.top - containerRect.top
          };
        }
      }

      // If cursor is at the end of the line but not within any token
      const cursorPosition = {
        x: lineRect.right - containerRect.left,
        y: lineRect.top - containerRect.top
      };

      richTextLogger.logInfo('📍 Positioning cursor at end of line', {
        lineIndex,
        cursorPosition
      });

      return cursorPosition;
    }
  }

  // Fallback: position at the end of the last line
  if (lineElements.length > 0) {
    const lastLine = lineElements[lineElements.length - 1];
    const lastLineRect = lastLine.getBoundingClientRect();

    const fallbackPosition = {
      x: lastLineRect.right - containerRect.left,
      y: lastLineRect.top - containerRect.top
    };

    richTextLogger.logInfo(
      '📍 Fallback: positioning cursor at end of last line',
      {
        textIndex,
        lastLineIndex: lineElements.length - 1,
        fallbackPosition
      }
    );

    return fallbackPosition;
  }

  richTextLogger.logInfo('❌ No suitable line found for cursor position', {
    textIndex,
    lineElementsCount: lineElements.length
  });

  return { x: 0, y: 0 };
}

/**
 * Calculate cursor position within token-based structure (single-line fallback)
 */
function calculateCursorInTokenBasedStructure(
  position: RichInputPosition,
  contentElement: HTMLElement,
  rawText: string
): { x: number; y: number } | null {
  const tokenElements = contentElement.querySelectorAll('[data-token-start]');
  const containerRect = contentElement.getBoundingClientRect();
  const textIndex = position.index;

  for (const tokenElement of tokenElements) {
    const tokenStart = parseInt(
      tokenElement.getAttribute('data-token-start') || '0'
    );
    const tokenEnd = parseInt(
      tokenElement.getAttribute('data-token-end') || '0'
    );

    if (textIndex >= tokenStart && textIndex <= tokenEnd) {
      const charOffsetInToken = textIndex - tokenStart;

      const tokenPosition = calculatePreciseCursorInToken(
        tokenElement as HTMLElement,
        charOffsetInToken,
        rawText.substring(tokenStart, tokenEnd)
      );

      if (tokenPosition) {
        return {
          x: tokenPosition.x - containerRect.left,
          y: tokenPosition.y - containerRect.top
        };
      }
    }
  }

  return { x: 0, y: 0 };
}

/**
 * Calculate precise cursor position within a token element
 */
function calculatePreciseCursorInToken(
  tokenElement: HTMLElement,
  charOffset: number,
  tokenText: string
): { x: number; y: number } | null {
  try {
    // For empty tokens or zero offset, position at the start
    if (tokenText.length === 0 || charOffset === 0) {
      const tokenRect = tokenElement.getBoundingClientRect();
      return {
        x: tokenRect.left,
        y: tokenRect.top
      };
    }

    // Use DOM range for precise positioning
    const textNodes = getTextNodesInElement(tokenElement);
    if (textNodes.length === 0) {
      const tokenRect = tokenElement.getBoundingClientRect();
      return {
        x: tokenRect.left,
        y: tokenRect.top
      };
    }

    // Find the correct text node and offset
    let remainingOffset = charOffset;
    let targetTextNode: Text | null = null;
    let targetOffset = 0;

    for (const textNode of textNodes) {
      const nodeText = textNode.textContent || '';
      if (remainingOffset <= nodeText.length) {
        targetTextNode = textNode;
        targetOffset = remainingOffset;
        break;
      }
      remainingOffset -= nodeText.length;
    }

    if (!targetTextNode) {
      // Position at the end of the last text node
      targetTextNode = textNodes[textNodes.length - 1];
      targetOffset = (targetTextNode.textContent || '').length;
    }

    const range = document.createRange();
    range.setStart(
      targetTextNode,
      Math.min(targetOffset, (targetTextNode.textContent || '').length)
    );
    range.collapse(true);

    const rangeRect = range.getBoundingClientRect();
    return {
      x: rangeRect.left,
      y: rangeRect.top
    };
  } catch (error) {
    console.warn('Error calculating precise cursor position:', error);

    // Fallback to proportional positioning
    const tokenRect = tokenElement.getBoundingClientRect();
    const proportionalX =
      tokenText.length > 0
        ? (charOffset / tokenText.length) * tokenRect.width
        : 0;

    return {
      x: tokenRect.left + proportionalX,
      y: tokenRect.top
    };
  }
}

/**
 * Calculate cursor position within a specific token with enhanced line break support
 */
export function calculateCursorWithinToken(
  tokenPosition: TokenPosition,
  contentElement: HTMLElement,
  rawText: string
): { x: number; y: number } | null {
  const tokenElements = contentElement.querySelectorAll('[data-token-index]');
  const tokenElement = tokenElements[tokenPosition.tokenIndex] as HTMLElement;

  if (!tokenElement) return null;

  const tokenRect = tokenElement.getBoundingClientRect();
  const containerRect = contentElement.getBoundingClientRect();

  // Special handling for text tokens with newlines
  if (tokenPosition.token.metadata?.hasNewlines) {
    // For text tokens containing newlines, use range-based positioning
    // This handles multi-line text content properly
    const cursorPosition = calculateCursorPositionWithRange(
      tokenPosition,
      tokenElement,
      rawText
    );

    if (cursorPosition) {
      return {
        x: cursorPosition.x - containerRect.left,
        y: cursorPosition.y - containerRect.top
      };
    }

    // Fallback to token boundaries
    return {
      x: tokenRect.left - containerRect.left,
      y: tokenRect.top - containerRect.top
    };
  }

  // For whitespace tokens (non-newline), position cursor at the beginning
  if (tokenPosition.token.metadata?.isWhitespace) {
    return {
      x: tokenRect.left - containerRect.left,
      y: tokenRect.top - containerRect.top
    };
  }

  // For non-whitespace tokens, calculate precise character position
  try {
    // Use enhanced range positioning for multi-line content
    const cursorPosition = calculateCursorPositionWithRange(
      tokenPosition,
      tokenElement,
      rawText
    );

    if (cursorPosition) {
      richTextLogger.logInfo('Calculated cursor position within token', {
        tokenIndex: tokenPosition.tokenIndex,
        charOffset: tokenPosition.charOffsetInToken,
        tokenBounds: {
          left: tokenRect.left - containerRect.left,
          right: tokenRect.right - containerRect.left,
          width: tokenRect.width
        },
        cursorPosition: {
          x: cursorPosition.x - containerRect.left,
          y: cursorPosition.y - containerRect.top
        }
      });

      return {
        x: cursorPosition.x - containerRect.left,
        y: cursorPosition.y - containerRect.top
      };
    }

    // Fallback to token boundaries
    return {
      x: tokenRect.left - containerRect.left,
      y: tokenRect.top - containerRect.top
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
 * Enhanced cursor position calculation using DOM ranges with line break support
 */
export function calculateCursorPositionWithRange(
  tokenPosition: TokenPosition,
  tokenElement: HTMLElement,
  rawText: string
): { x: number; y: number } | null {
  try {
    const range = document.createRange();
    const tokenRawText = tokenPosition.token.rawText;
    const charOffset = tokenPosition.charOffsetInToken;

    // Special handling for tokens with newlines rendered as <br /> elements
    if (tokenPosition.token.metadata?.hasNewlines) {
      return calculateCursorPositionInMultilineToken(
        tokenElement,
        tokenRawText,
        charOffset
      );
    }

    // For regular text tokens, use standard range positioning
    const textNodes = getTextNodesInElement(tokenElement);
    if (textNodes.length === 0) {
      return null;
    }

    // Find the correct text node and offset
    let remainingOffset = charOffset;
    let targetTextNode: Text | null = null;
    let targetOffset = 0;

    for (const textNode of textNodes) {
      const nodeText = textNode.textContent || '';
      if (remainingOffset <= nodeText.length) {
        targetTextNode = textNode;
        targetOffset = remainingOffset;
        break;
      }
      remainingOffset -= nodeText.length;
    }

    if (!targetTextNode && textNodes.length > 0) {
      targetTextNode = textNodes[textNodes.length - 1];
      targetOffset = (targetTextNode.textContent || '').length;
    }

    if (!targetTextNode) {
      return null;
    }

    range.setStart(
      targetTextNode,
      Math.min(targetOffset, (targetTextNode.textContent || '').length)
    );
    range.collapse(true);

    const rangeRect = range.getBoundingClientRect();
    return {
      x: rangeRect.left,
      y: rangeRect.top
    };
  } catch (error) {
    console.warn('Error in calculateCursorPositionWithRange:', error);
    return null;
  }
}

/**
 * Calculate cursor position within a token that contains newlines rendered as <br /> elements
 */
function calculateCursorPositionInMultilineToken(
  tokenElement: HTMLElement,
  tokenRawText: string,
  charOffset: number
): { x: number; y: number } | null {
  try {
    // Split the raw text by newlines to understand the line structure
    const lines = tokenRawText.split('\n');

    // Find which line the cursor should be on
    let currentOffset = 0;
    let targetLineIndex = 0;
    let offsetInLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length;

      if (charOffset <= currentOffset + lineLength) {
        // Cursor is on this line
        targetLineIndex = i;
        offsetInLine = charOffset - currentOffset;
        break;
      }

      // Move to next line (add 1 for the newline character)
      currentOffset += lineLength + 1;
    }

    // Now find the corresponding DOM elements
    const childNodes = Array.from(tokenElement.childNodes);
    let currentLineInDOM = 0;
    let targetTextNode: Text | null = null;

    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (currentLineInDOM === targetLineIndex) {
          targetTextNode = node as Text;
          break;
        }
      } else if (node.nodeName === 'BR') {
        currentLineInDOM++;
      }
    }

    if (!targetTextNode) {
      // If we can't find the exact text node, position at the end of the token
      const tokenRect = tokenElement.getBoundingClientRect();
      return {
        x: tokenRect.right,
        y: tokenRect.bottom
      };
    }

    // Create a range to measure the exact position within the text node
    const range = document.createRange();
    const nodeText = targetTextNode.textContent || '';
    const clampedOffset = Math.min(offsetInLine, nodeText.length);

    range.setStart(targetTextNode, clampedOffset);
    range.collapse(true);

    const rangeRect = range.getBoundingClientRect();
    return {
      x: rangeRect.left,
      y: rangeRect.top
    };
  } catch (error) {
    console.warn('Error in calculateCursorPositionInMultilineToken:', error);
    return null;
  }
}

/**
 * Get all text nodes within an element
 */
export function getTextNodesInElement(element: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node: Text | null = walker.nextNode() as Text;
  while (node) {
    textNodes.push(node);
    node = walker.nextNode() as Text;
  }

  return textNodes;
}

/**
 * Get the first text node within an element
 */
export function getFirstTextNode(element: HTMLElement): Text | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  return walker.nextNode() as Text | null;
}

/**
 * Calculate position at the end of all content
 */
export function calculateEndOfContentPosition(contentElement: HTMLElement): {
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
export function fallbackCursorPosition(
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
