/**
 * Click positioning utilities for rich input components
 * Handles converting mouse clicks to cursor positions with token awareness
 */

import { createLogger } from '@lib/logging';
import type { RichInputPosition } from '../types';
import { getFirstTextNode } from './cursorCalculations';
import { richTextLogger } from './logger';
import { findLastTextPosition } from './navigationUtils';

const logger = createLogger({
  context: {
    component: 'ClickPositioning',
    module: 'rich-input/utils'
  }
});

/**
 * Calculate click position with character-level precision
 * Uses a simpler coordinate-based approach that matches the working token click detection
 * Updated to work with line-based rendering structure
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

    richTextLogger.logInfo('🔍 Line-Based Click Position Debug', {
      clickCoordinates: {
        globalX: e.clientX,
        globalY: e.clientY,
        relativeX: clickX,
        relativeY: clickY,
        contentRect: { width: rect.width, height: rect.height }
      }
    });

    // Check if we have line-based structure (multiline mode)
    const lineElements = contentElement.querySelectorAll('.rich-input-line');

    if (lineElements.length > 0) {
      // Line-based rendering - find the clicked line first
      for (const lineElement of lineElements) {
        const lineRect = lineElement.getBoundingClientRect();
        const lineRelativeRect = {
          left: lineRect.left - rect.left,
          top: lineRect.top - rect.top,
          right: lineRect.right - rect.left,
          bottom: lineRect.bottom - rect.top,
          width: lineRect.width,
          height: lineRect.height
        };

        // Check if click is within this line's vertical bounds
        if (
          clickY >= lineRelativeRect.top &&
          clickY <= lineRelativeRect.bottom
        ) {
          // Now find tokens within this line
          const lineTokenElements =
            lineElement.querySelectorAll('[data-token-start]');

          for (const tokenElement of lineTokenElements) {
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

              // Calculate character position within token
              const clickXInToken = clickX - tokenRelativeRect.left;
              const avgCharWidth = 8; // Approximate character width
              const charOffsetInToken = Math.floor(
                clickXInToken / avgCharWidth
              );
              const clickedCharIndex = Math.min(
                tokenStart + charOffsetInToken,
                tokenEnd - 1
              );

              richTextLogger.logInfo('🎯 Found matching token in line', {
                lineIndex: Array.from(lineElements).indexOf(lineElement),
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

          // Click is within line but not within any token - position at end of line
          const lineIndex = Array.from(lineElements).indexOf(lineElement);
          const lineStart = parseInt(
            lineElement.getAttribute('data-line-start') || '0'
          );
          const lineEnd = parseInt(
            lineElement.getAttribute('data-line-end') ||
              rawText.length.toString()
          );

          // Position at end of line content (excluding trailing whitespace)
          const lineText = rawText.substring(lineStart, lineEnd);
          const trimmedLineText = lineText.trimEnd();
          const lineEndPosition = lineStart + trimmedLineText.length;

          richTextLogger.logInfo('🎯 Click within line but outside tokens', {
            lineIndex,
            lineStart,
            lineEnd,
            lineText: JSON.stringify(lineText),
            trimmedLineText: JSON.stringify(trimmedLineText),
            lineEndPosition,
            clickXPosition: clickX,
            lineWidth: lineRelativeRect.width
          });

          return {
            index: Math.max(0, Math.min(lineEndPosition, rawText.length))
          };
        }
      }

      // Click is outside all lines - determine if above first line or below last line
      const firstLineElement = lineElements[0];
      const lastLineElement = lineElements[lineElements.length - 1];

      if (firstLineElement && lastLineElement) {
        const firstLineRect = firstLineElement.getBoundingClientRect();
        const lastLineRect = lastLineElement.getBoundingClientRect();
        const firstLineTop = firstLineRect.top - rect.top;
        const lastLineBottom = lastLineRect.bottom - rect.top;

        if (clickY < firstLineTop) {
          // Click above first line - position at beginning of document
          richTextLogger.logInfo(
            '🎯 Click above first line - positioning at start',
            {
              clickY,
              firstLineTop
            }
          );
          return { index: 0 };
        } else if (clickY > lastLineBottom) {
          // Click below last line - position at end of document
          const lastTextPosition = findLastTextPosition(rawText);
          richTextLogger.logInfo(
            '🎯 Click below last line - positioning at end',
            {
              clickY,
              lastLineBottom,
              lastTextPosition
            }
          );
          return { index: lastTextPosition };
        }
      }
    } else {
      // Fallback to original token-based approach for single-line mode
      const tokenElements =
        contentElement.querySelectorAll('[data-token-start]');

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

          // Calculate character position within token
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
    richTextLogger.logInfo('❌ Error in line-based click positioning', {
      error
    });
    return { index: 0 };
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

    // Analyze text for newlines
    const newlinePositions = [];
    for (let i = 0; i < rawText.length; i++) {
      if (rawText[i] === '\n') {
        newlinePositions.push(i);
      }
    }
    const hasNewlines = newlinePositions.length > 0;
    const lineCount = hasNewlines ? newlinePositions.length + 1 : 1;

    // Get all tokens for analysis
    const tokenElements = contentElement.querySelectorAll('[data-token-index]');
    const tokens = Array.from(tokenElements).map((el, index) => {
      const element = el as HTMLElement;
      return {
        index,
        type: element.dataset.tokenType || 'text',
        content: element.dataset.tokenContent || '',
        rawText: element.textContent || '',
        start: parseInt(element.dataset.tokenStart || '0'),
        end: parseInt(element.dataset.tokenEnd || '0'),
        metadata: {
          isNewline: element.dataset.isNewline === 'true',
          isWhitespace: element.dataset.isWhitespace === 'true'
        }
      };
    });

    richTextLogger.logCursorPositioning({
      clickCoordinates: { x: clickX, y: clickY },
      rawText,
      tokens,
      newlineInfo: {
        hasNewlines,
        newlinePositions,
        lineCount
      },
      domElements: {
        contentElement: contentElement.tagName,
        tokenElements: tokenElements.length
      }
    });

    richTextLogger.logInfo('Processing token-aware click', {
      clickCoordinates: `(${clickX}, ${clickY})`,
      contentElementBounds: {
        width: rect.width,
        height: rect.height
      }
    });

    // Special handling for empty input with dummy token
    if (rawText.length === 0 && tokenElements.length === 1) {
      const dummyElement = tokenElements[0] as HTMLElement;
      if (dummyElement.getAttribute('data-is-dummy') === 'true') {
        richTextLogger.logInfo('Click on dummy token in empty input', {
          clickCoordinates: { x: clickX, y: clickY }
        });
        return { index: 0 };
      }
    }

    // Find the token element that was clicked
    for (let i = 0; i < tokenElements.length; i++) {
      const tokenElement = tokenElements[i] as HTMLElement;
      const tokenRect = tokenElement.getBoundingClientRect();

      // Calculate token bounds relative to content element
      const tokenRelativeLeft = tokenRect.left - rect.left;
      const tokenRelativeRight = tokenRect.right - rect.left;
      const tokenRelativeTop = tokenRect.top - rect.top;
      const tokenRelativeBottom = tokenRect.bottom - rect.top;

      // Check if click is within this token's bounds
      if (
        clickX >= tokenRelativeLeft &&
        clickX <= tokenRelativeRight &&
        clickY >= tokenRelativeTop &&
        clickY <= tokenRelativeBottom
      ) {
        // Click is within this token
        const tokenStart = parseInt(tokenElement.dataset.tokenStart || '0');
        const tokenEnd = parseInt(tokenElement.dataset.tokenEnd || '0');
        const isWhitespace = tokenElement.dataset.isWhitespace === 'true';
        const isNewline = tokenElement.dataset.isNewline === 'true';

        const foundToken = {
          tokenIndex: i,
          type: tokenElement.dataset.tokenType || 'text',
          content: tokenElement.dataset.tokenContent || '',
          rawText: tokenElement.textContent || '',
          start: tokenStart,
          end: tokenEnd,
          metadata: { isWhitespace, isNewline }
        };

        richTextLogger.logInfo('Found clicked token', {
          tokenIndex: i,
          tokenBounds: `${tokenStart}-${tokenEnd}`,
          isWhitespace,
          isNewline,
          tokenType: tokenElement.dataset.tokenType,
          clickXInToken: clickX - tokenRelativeLeft
        });

        // For newline tokens, allow positioning before or after the newline
        if (isNewline) {
          // For newline tokens, check if click is closer to start or end
          const tokenCenterX =
            tokenRelativeLeft + (tokenRelativeRight - tokenRelativeLeft) / 2;

          // If click is before center, position before newline, otherwise after
          const positionAfterNewline = clickX > tokenCenterX;
          const cursorIndex = positionAfterNewline ? tokenEnd : tokenStart;
          const charOffsetInToken = positionAfterNewline ? 1 : 0; // 0 = before newline, 1 = after newline

          const calculatedPosition = {
            index: cursorIndex,
            tokenIndex: i,
            charOffsetInToken
          };

          richTextLogger.logCursorPositioning({
            clickCoordinates: { x: clickX, y: clickY },
            textIndex: cursorIndex,
            foundToken,
            calculatedPosition,
            newlineInfo: {
              hasNewlines,
              newlinePositions,
              lineCount
            }
          });

          return { index: cursorIndex };
        }

        // For other whitespace tokens, position cursor at the beginning
        if (isWhitespace) {
          const calculatedPosition = {
            index: tokenStart,
            tokenIndex: i,
            charOffsetInToken: 0
          };

          richTextLogger.logCursorPositioning({
            clickCoordinates: { x: clickX, y: clickY },
            textIndex: tokenStart,
            foundToken,
            calculatedPosition,
            newlineInfo: {
              hasNewlines,
              newlinePositions,
              lineCount
            }
          });

          return { index: tokenStart };
        }

        // For non-whitespace tokens, calculate precise character position
        const charPosition = calculateCharacterPositionInToken(
          clickX - tokenRelativeLeft,
          tokenElement,
          tokenStart,
          tokenEnd
        );

        const calculatedPosition = {
          index: charPosition,
          tokenIndex: i,
          charOffsetInToken: charPosition - tokenStart
        };

        richTextLogger.logCursorPositioning({
          clickCoordinates: { x: clickX, y: clickY },
          textIndex: charPosition,
          foundToken,
          calculatedPosition,
          newlineInfo: {
            hasNewlines,
            newlinePositions,
            lineCount
          }
        });

        return { index: charPosition };
      }
    }

    // Click is outside all tokens - check if we're clicking on a blank line
    richTextLogger.logInfo(
      'Click outside all tokens, checking for blank line positioning'
    );

    // Check if we're clicking near a newline position
    if (hasNewlines && newlinePositions.length > 0) {
      // Estimate line height from content element
      const computedStyle = window.getComputedStyle(contentElement);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.4 ||
        20; // fallback

      // Calculate which line the click is on based on Y coordinate
      const clickedLineIndex = Math.floor(clickY / lineHeight);

      richTextLogger.logInfo('Blank line click analysis', {
        clickY,
        lineHeight,
        clickedLineIndex,
        totalLines: lineCount,
        newlinePositions
      });

      // If clicking on a line that exists and is near the left edge (suggesting blank line)
      if (
        clickedLineIndex >= 0 &&
        clickedLineIndex < lineCount &&
        clickX < 50
      ) {
        // For line 0, position at start
        if (clickedLineIndex === 0) {
          const calculatedPosition = {
            index: 0,
            tokenIndex: -1,
            charOffsetInToken: 0
          };

          richTextLogger.logCursorPositioning({
            clickCoordinates: { x: clickX, y: clickY },
            textIndex: 0,
            calculatedPosition,
            blankLineInfo: {
              clickedLineIndex,
              positionedAtStart: true
            }
          });

          return { index: 0 };
        }

        // For other lines, check if we have a newline at the expected position
        if (clickedLineIndex <= newlinePositions.length) {
          // Position after the previous newline
          const targetNewlineIndex = clickedLineIndex - 1;
          if (
            targetNewlineIndex >= 0 &&
            targetNewlineIndex < newlinePositions.length
          ) {
            const newlinePosition = newlinePositions[targetNewlineIndex];
            const cursorPosition = newlinePosition + 1; // Position after the newline

            const calculatedPosition = {
              index: cursorPosition,
              tokenIndex: -1,
              charOffsetInToken: 0
            };

            richTextLogger.logCursorPositioning({
              clickCoordinates: { x: clickX, y: clickY },
              textIndex: cursorPosition,
              calculatedPosition,
              blankLineInfo: {
                clickedLineIndex,
                targetNewlineIndex,
                newlinePosition,
                positionedAfterNewline: true
              }
            });

            return { index: cursorPosition };
          }
        }
      }
    }

    // Default fallback - position at end
    const calculatedPosition = {
      index: rawText.length,
      tokenIndex: -1,
      charOffsetInToken: 0
    };

    richTextLogger.logCursorPositioning({
      clickCoordinates: { x: clickX, y: clickY },
      textIndex: rawText.length,
      calculatedPosition,
      newlineInfo: {
        hasNewlines,
        newlinePositions,
        lineCount
      }
    });

    return { index: rawText.length };
  } catch (error) {
    logger.warn('Error in token-aware click positioning', { error });
    return { index: 0 };
  }
}

/**
 * Calculate the character position within a token based on click X coordinate
 */
export function calculateCharacterPositionInToken(
  clickXInToken: number,
  tokenElement: HTMLElement,
  tokenStart: number,
  tokenEnd: number
): number {
  try {
    // Check if this token has newlines (multiline content)
    const hasNewlines =
      tokenElement.getAttribute('data-has-newlines') === 'true';

    if (hasNewlines) {
      // For multiline tokens, use the full token content from data attributes
      const fullTokenText =
        tokenElement.getAttribute('data-token-content') ||
        tokenElement.textContent ||
        '';
      return calculateCharacterPositionInMultilineToken(
        clickXInToken,
        tokenElement,
        tokenStart,
        tokenEnd,
        fullTokenText
      );
    }

    // For single-line tokens, use the existing logic
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
        logger.warn('Error using caretPositionFromPoint', { error });
        // Fall through to proportional positioning
      }
    }

    // Fallback: proportional positioning with improved accuracy
    const tokenRect = tokenElement.getBoundingClientRect();
    const tokenWidth = tokenRect.width;

    if (tokenWidth <= 0) {
      return tokenStart;
    }

    // Calculate proportion, ensuring it's within bounds
    const proportion = Math.max(0, Math.min(1, clickXInToken / tokenWidth));

    // Use more accurate character width estimation
    const avgCharWidth = tokenWidth / tokenLength;
    const charOffset = Math.round(clickXInToken / avgCharWidth);

    // Ensure we don't exceed token bounds
    const clampedCharOffset = Math.max(
      0,
      Math.min(charOffset, tokenLength - 1)
    );
    const charIndex = tokenStart + clampedCharOffset;

    richTextLogger.logInfo('Used proportional positioning fallback', {
      clickXInToken,
      tokenWidth,
      proportion,
      avgCharWidth,
      charOffset,
      clampedCharOffset,
      calculatedIndex: charIndex,
      tokenLength
    });

    return charIndex;
  } catch (error) {
    logger.warn('Error calculating character position in token', { error });
    return tokenStart;
  }
}

/**
 * Calculate character position within a multiline token based on click coordinates
 */
function calculateCharacterPositionInMultilineToken(
  clickXInToken: number,
  tokenElement: HTMLElement,
  tokenStart: number,
  tokenEnd: number,
  fullTokenText: string
): number {
  try {
    // Use browser's caretPositionFromPoint for precise positioning in multiline content
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
          // For multiline tokens, we need to map the DOM position back to the raw text position
          const domOffset = caretPosition.offset;
          const targetNode = caretPosition.offsetNode;

          // Calculate the position in the full raw text
          const rawTextPosition = mapDOMPositionToRawText(
            tokenElement,
            targetNode,
            domOffset,
            fullTokenText
          );

          const charIndex =
            tokenStart + Math.min(rawTextPosition, fullTokenText.length);

          richTextLogger.logInfo(
            'Calculated character position in multiline token',
            {
              clickXInToken,
              domOffset,
              rawTextPosition,
              calculatedIndex: charIndex,
              fullTokenText:
                fullTokenText.substring(0, 30) +
                (fullTokenText.length > 30 ? '...' : '')
            }
          );

          return charIndex;
        }
      } catch (error) {
        logger.warn('Error using caretPositionFromPoint for multiline:', {
          error
        });
      }
    }

    // Fallback: use line-based positioning for multiline content
    const lines = fullTokenText.split('\n');
    const tokenRect = tokenElement.getBoundingClientRect();

    // Estimate line height
    const estimatedLineHeight = tokenRect.height / lines.length;
    const clickY = estimatedLineHeight / 2; // We don't have the actual clickY, so estimate middle of token
    const clickedLineIndex = Math.floor(clickY / estimatedLineHeight);

    if (clickedLineIndex >= 0 && clickedLineIndex < lines.length) {
      // Calculate offset to the start of this line
      let lineStartOffset = 0;
      for (let i = 0; i < clickedLineIndex; i++) {
        lineStartOffset += lines[i].length + 1; // +1 for the newline character
      }

      // Estimate character position within the line
      const lineText = lines[clickedLineIndex];
      const lineWidth = tokenRect.width; // Assume full width for now
      const avgCharWidth = lineWidth / Math.max(lineText.length, 1);
      const charOffsetInLine = Math.round(clickXInToken / avgCharWidth);
      const clampedCharOffsetInLine = Math.max(
        0,
        Math.min(charOffsetInLine, lineText.length)
      );

      const finalPosition = lineStartOffset + clampedCharOffsetInLine;
      const charIndex =
        tokenStart + Math.min(finalPosition, fullTokenText.length);

      richTextLogger.logInfo(
        'Used line-based positioning fallback for multiline',
        {
          clickXInToken,
          clickedLineIndex,
          lineStartOffset,
          charOffsetInLine: clampedCharOffsetInLine,
          finalPosition,
          calculatedIndex: charIndex,
          lineText:
            lineText.substring(0, 20) + (lineText.length > 20 ? '...' : '')
        }
      );

      return charIndex;
    }

    // Final fallback: return start of token
    return tokenStart;
  } catch (error) {
    logger.warn('Error calculating character position in multiline token:', {
      error
    });
    return tokenStart;
  }
}

/**
 * Map a DOM position (node + offset) back to the raw text position within a multiline token
 */
function mapDOMPositionToRawText(
  tokenElement: HTMLElement,
  targetNode: Node,
  domOffset: number,
  fullTokenText: string
): number {
  try {
    // Walk through the DOM structure to find where this position maps to in the raw text
    const childNodes = Array.from(tokenElement.childNodes);
    let rawTextOffset = 0;

    for (const node of childNodes) {
      if (node === targetNode) {
        // Found the target node, add the offset within this node
        return rawTextOffset + domOffset;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        // Text node - add its length to the raw text offset
        const textContent = node.textContent || '';
        if (node === targetNode) {
          return rawTextOffset + domOffset;
        }
        rawTextOffset += textContent.length;
      } else if (node.nodeName === 'BR') {
        // BR element represents a newline in the raw text
        rawTextOffset += 1; // Add 1 for the \n character
      }
    }

    // If we didn't find the target node, return the current offset
    return rawTextOffset;
  } catch (error) {
    logger.warn('Error mapping DOM position to raw text', { error });
    return 0;
  }
}
