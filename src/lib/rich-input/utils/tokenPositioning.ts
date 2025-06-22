/**
 * Token positioning utilities for rich input components
 * Handles finding tokens at positions and creating token objects from DOM elements
 */

import type { RichContentToken } from '../types';
import { richTextLogger } from './logger';

export interface TokenPosition {
  tokenIndex: number;
  charOffsetInToken: number;
  token: RichContentToken;
}

/**
 * Helper function to get token raw text, handling br elements properly
 */
export function getTokenRawText(tokenElement: HTMLElement): string {
  // For br elements and other elements without textContent, use data-token-content
  return tokenElement.dataset.tokenContent || tokenElement.textContent || '';
}

/**
 * Find which token contains the given text position
 */
export function findTokenAtPosition(
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
    const isNewline = tokenElement.getAttribute('data-is-newline') === 'true';

    // Check if the text index falls within this token's bounds
    // For newline tokens, include the end position since we position cursor after newlines
    const includesPosition = isNewline
      ? textIndex >= tokenStart && textIndex <= tokenEnd
      : textIndex >= tokenStart && textIndex < tokenEnd;

    if (includesPosition) {
      // Found the token containing this position
      const charOffsetInToken =
        isNewline && textIndex === tokenEnd
          ? 1 // Position after newline
          : textIndex - tokenStart; // Position before newline or within regular token

      // Create token object from DOM data with metadata
      const token: RichContentToken = {
        type: tokenElement.dataset.tokenType as any,
        content: tokenElement.dataset.tokenContent || '',
        rawText: getTokenRawText(tokenElement),
        start: tokenStart,
        end: tokenEnd,
        metadata: {
          isWhitespace:
            tokenElement.getAttribute('data-is-whitespace') === 'true',
          isNewline: tokenElement.getAttribute('data-is-newline') === 'true',
          hasNewlines: tokenElement.getAttribute('data-has-newlines') === 'true'
        }
      };

      richTextLogger.logInfo('Found token for position', {
        textIndex,
        tokenIndex: i,
        charOffsetInToken,
        tokenBounds: `${tokenStart}-${tokenEnd}`,
        tokenContent: token.content,
        isNewline: token.metadata?.isNewline,
        isWhitespace: token.metadata?.isWhitespace
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

      // Create token object from DOM data with metadata
      const token: RichContentToken = {
        type: tokenElement.dataset.tokenType as any,
        content: tokenElement.dataset.tokenContent || '',
        rawText: getTokenRawText(tokenElement),
        start: tokenStart,
        end: tokenEnd,
        metadata: {
          isWhitespace:
            tokenElement.getAttribute('data-is-whitespace') === 'true',
          isNewline: tokenElement.getAttribute('data-is-newline') === 'true',
          hasNewlines: tokenElement.getAttribute('data-has-newlines') === 'true'
        }
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
      distance: closestDistance,
      isNewline: closestToken.token.metadata?.isNewline,
      isWhitespace: closestToken.token.metadata?.isWhitespace
    });
  }

  return closestToken;
}

/**
 * Create token object from DOM element with proper metadata handling
 */
export function createTokenFromElement(
  tokenElement: HTMLElement,
  tokenIndex: number
): RichContentToken {
  const tokenStart = parseInt(tokenElement.dataset.tokenStart || '0');
  const tokenEnd = parseInt(tokenElement.dataset.tokenEnd || '0');

  return {
    type: tokenElement.dataset.tokenType as any,
    content: tokenElement.dataset.tokenContent || '',
    rawText: getTokenRawText(tokenElement),
    start: tokenStart,
    end: tokenEnd,
    metadata: {
      isWhitespace: tokenElement.getAttribute('data-is-whitespace') === 'true',
      isNewline: tokenElement.getAttribute('data-is-newline') === 'true',
      hasNewlines: tokenElement.getAttribute('data-has-newlines') === 'true'
    }
  };
}
