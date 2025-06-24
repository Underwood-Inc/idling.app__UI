import { createLogger } from '@/lib/logging';
import type {
  RichContentToken,
  RichInputPosition,
  RichInputSelection
} from '../types';

const logger = createLogger({
  component: 'CoordinateCalculations',
  module: 'rich-input'
});

// Helper functions for coordinate calculations
export function calculateCursorCoordinates(
  position: RichInputPosition,
  tokens: RichContentToken[],
  contentElement: HTMLElement | null,
  measureElement: HTMLElement | null
): { x: number; y: number } | null {
  if (!contentElement) return null;

  try {
    // Use the new rendered-content-based measurement system
    return calculateCursorFromRenderedContent(position, contentElement);
  } catch (error) {
    logger.warn('Error calculating cursor coordinates', { error });
    return null;
  }
}

// New function that measures actual rendered content for accurate cursor positioning
export function calculateCursorFromRenderedContent(
  position: RichInputPosition,
  contentElement: HTMLElement
): { x: number; y: number } | null {
  try {
    // Create a range to find the exact position in the rendered DOM
    const range = document.createRange();
    const walker = document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT
    );

    let currentTextIndex = 0;
    let targetNode: Text | null = null;
    let targetOffset = 0;

    // Walk through all text nodes to find where our position falls
    let node: Text | null = walker.nextNode() as Text;
    while (node) {
      const nodeText = node.textContent || '';
      const nodeLength = nodeText.length;

      if (currentTextIndex + nodeLength >= position.index) {
        // Our target position is within this text node
        targetNode = node;
        targetOffset = position.index - currentTextIndex;
        break;
      }

      currentTextIndex += nodeLength;
      node = walker.nextNode() as Text;
    }

    if (!targetNode) {
      // Position is beyond all text content - place cursor at the end
      const lastChild = contentElement.lastChild;
      if (lastChild) {
        if (lastChild.nodeType === Node.TEXT_NODE) {
          targetNode = lastChild as Text;
          targetOffset = (lastChild.textContent || '').length;
        } else {
          // Last child is an element (like a pill) - place cursor after it
          range.setStartAfter(lastChild);
          range.collapse(true);
          const rect = range.getBoundingClientRect();
          const containerRect = contentElement.getBoundingClientRect();

          return {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top
          };
        }
      } else {
        // No content at all
        return { x: 0, y: 0 };
      }
    }

    if (targetNode) {
      // Set range to the exact position within the text node
      range.setStart(
        targetNode,
        Math.min(targetOffset, targetNode.textContent?.length || 0)
      );
      range.collapse(true);

      // Get the visual position of this range
      const rect = range.getBoundingClientRect();
      const containerRect = contentElement.getBoundingClientRect();

      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top
      };
    }

    return { x: 0, y: 0 };
  } catch (error) {
    logger.warn('Error in rendered content cursor calculation', { error });
    return null;
  }
}

export function calculateSelectionCoordinates(
  selection: RichInputSelection,
  tokens: RichContentToken[],
  contentElement: HTMLElement | null,
  measureElement: HTMLElement | null
): Array<{ x: number; y: number; width: number; height: number }> {
  if (
    !contentElement ||
    !measureElement ||
    selection.start.index === selection.end.index
  )
    return [];

  try {
    const range = document.createRange();
    const startPos = Math.min(selection.start.index, selection.end.index);
    const endPos = Math.max(selection.start.index, selection.end.index);

    // Find start and end positions
    const startResult = findTextNodeAndOffset(contentElement, startPos);
    const endResult = findTextNodeAndOffset(contentElement, endPos);

    if (!startResult || !endResult) return [];

    // Set range for selection
    range.setStart(startResult.node, startResult.offset);
    range.setEnd(endResult.node, endResult.offset);

    // Get selection rectangles (handles multi-line selections)
    const rects = range.getClientRects();
    const containerRect = contentElement.getBoundingClientRect();

    const selectionRects = Array.from(rects).map((rect) => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height
    }));

    range.detach();

    return selectionRects;
  } catch (error) {
    logger.warn('Error calculating selection coordinates', { error });
    return [];
  }
}

export function calculateClickPosition(
  e: React.MouseEvent,
  tokens: RichContentToken[],
  contentElement: HTMLElement | null,
  measureElement: HTMLElement | null
): RichInputPosition | null {
  if (!contentElement) return null;

  // Use the new rendered-content-based click positioning
  return calculateClickPositionFromRenderedContent(e, contentElement, tokens);
}

// New function that calculates click position based on actual rendered content
export function calculateClickPositionFromRenderedContent(
  e: React.MouseEvent,
  contentElement: HTMLElement,
  tokens: RichContentToken[]
): RichInputPosition | null {
  try {
    const rect = contentElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // First, check if we clicked directly on a pill element
    const clickedElement = e.target as HTMLElement;
    const tokenElement = clickedElement.closest('[data-token-start]');

    if (tokenElement) {
      // Click is on a pill - determine whether to position cursor at start or end
      const tokenStart = parseInt(
        tokenElement.getAttribute('data-token-start') || '0'
      );
      const tokenEnd = parseInt(
        tokenElement.getAttribute('data-token-end') || '0'
      );

      // Find the corresponding token
      const token = tokens.find(
        (t) => t.start === tokenStart && t.end === tokenEnd
      );
      if (
        token &&
        (token.type === 'hashtag' ||
          token.type === 'mention' ||
          token.type === 'url')
      ) {
        // For pills, determine position based on click location within the pill
        const tokenRect = tokenElement.getBoundingClientRect();
        const clickRelativeX = x - (tokenRect.left - rect.left);
        const tokenCenter = tokenRect.width / 2;

        // Position cursor at start or end of the entire token (including all raw text)
        const index = clickRelativeX < tokenCenter ? token.start : token.end;

        return createPositionFromIndex(index, contentElement.textContent || '');
      }
    }

    // For clicks not on pills, use caretPositionFromPoint or caretRangeFromPoint
    let targetNode: Node | null = null;
    let targetOffset = 0;

    if ((document as any).caretPositionFromPoint) {
      // Firefox
      const caretPos = (document as any).caretPositionFromPoint(
        e.clientX,
        e.clientY
      );
      if (caretPos) {
        targetNode = caretPos.offsetNode;
        targetOffset = caretPos.offset;
      }
    } else if ((document as any).caretRangeFromPoint) {
      // Chrome/Safari
      const range = (document as any).caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        targetNode = range.startContainer;
        targetOffset = range.startOffset;
      }
    }

    if (targetNode) {
      // Convert DOM position to text index
      const textIndex = getTextIndexFromDOMPosition(
        contentElement,
        targetNode,
        targetOffset
      );
      if (textIndex !== null) {
        return createPositionFromIndex(
          textIndex,
          contentElement.textContent || ''
        );
      }
    }

    // Fallback: position at end of content
    const allText = contentElement.textContent || '';
    return createPositionFromIndex(allText.length, allText);
  } catch (error) {
    logger.warn('Error in rendered content click calculation', { error });
    return null;
  }
}

// Helper function to create a RichInputPosition from a text index
export function createPositionFromIndex(
  index: number,
  allText: string
): RichInputPosition {
  const textBeforeIndex = allText.substring(0, index);
  const lines = textBeforeIndex.split('\n');
  const line = lines.length - 1;
  const column = lines[line]?.length || 0;

  return {
    index,
    line,
    column
  };
}

// Helper function to snap text index to pill boundaries
export function snapToPillBoundary(
  textIndex: number,
  tokens: RichContentToken[]
): number {
  // Find if the text index is inside a pill token
  const pillToken = tokens.find(
    (token) =>
      token.type !== 'text' && textIndex > token.start && textIndex < token.end
  );

  if (pillToken) {
    // Text index is inside a pill - snap to closest boundary
    const distanceToStart = textIndex - pillToken.start;
    const distanceToEnd = pillToken.end - textIndex;

    // Snap to the closest boundary
    return distanceToStart <= distanceToEnd ? pillToken.start : pillToken.end;
  }

  // Text index is not inside a pill, return as-is
  return textIndex;
}

// Helper function to find text node and offset for a given text index (pill-aware)
export function findTextNodeAndOffset(
  element: HTMLElement,
  textIndex: number
): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ALL, null);

  let currentRawIndex = 0;
  let node = walker.nextNode();

  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      const parent = node.parentElement;

      // Check if this text node is inside a pill
      if (
        parent &&
        parent.hasAttribute('data-token-start') &&
        parent.hasAttribute('data-token-end')
      ) {
        // This is a pill - get its raw text length from the token data
        const tokenStart = parseInt(
          parent.getAttribute('data-token-start') || '0'
        );
        const tokenEnd = parseInt(parent.getAttribute('data-token-end') || '0');
        const rawLength = tokenEnd - tokenStart;

        // Check if our target index falls within this pill's raw range
        if (
          textIndex >= currentRawIndex &&
          textIndex <= currentRawIndex + rawLength
        ) {
          // The target is within this pill
          // For pills, we position at the start or end of the visual text
          const distanceFromStart = textIndex - currentRawIndex;
          const distanceFromEnd = currentRawIndex + rawLength - textIndex;

          if (distanceFromStart <= distanceFromEnd) {
            // Closer to start - position at beginning of visual text
            return {
              node,
              offset: 0
            };
          } else {
            // Closer to end - position at end of visual text
            return {
              node,
              offset: textContent.length
            };
          }
        }

        // Move past this pill's raw text
        currentRawIndex += rawLength;
      } else {
        // Regular text node - use normal character mapping
        if (
          textIndex >= currentRawIndex &&
          textIndex <= currentRawIndex + textContent.length
        ) {
          // Target is within this text node
          return {
            node,
            offset: textIndex - currentRawIndex
          };
        }

        currentRawIndex += textContent.length;
      }
    }

    node = walker.nextNode();
  }

  // If we didn't find the exact position, try to find the last text node
  const lastWalker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  let lastNode = null;
  let current = lastWalker.nextNode();
  while (current) {
    lastNode = current;
    current = lastWalker.nextNode();
  }

  if (lastNode) {
    return {
      node: lastNode,
      offset: (lastNode as Text).textContent?.length || 0
    };
  }

  return null;
}

// Helper function to convert DOM position to text index (pill-aware)
export function getTextIndexFromDOMPosition(
  container: HTMLElement,
  node: Node,
  offset: number
): number | null {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ALL,
    null
  );

  let currentRawIndex = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const textContent = currentNode.textContent || '';
      const parent = currentNode.parentElement;

      // Check if we found our target node
      if (currentNode === node) {
        // Check if this text node is inside a pill
        if (
          parent &&
          parent.hasAttribute('data-token-start') &&
          parent.hasAttribute('data-token-end')
        ) {
          // This is a pill - map visual offset to raw position
          const tokenStart = parseInt(
            parent.getAttribute('data-token-start') || '0'
          );
          const tokenEnd = parseInt(
            parent.getAttribute('data-token-end') || '0'
          );
          const rawLength = tokenEnd - tokenStart;

          // For pills, if offset is closer to start, return start of raw text
          // If closer to end, return end of raw text
          const visualLength = textContent.length;
          if (offset <= visualLength / 2) {
            return currentRawIndex; // Start of pill
          } else {
            return currentRawIndex + rawLength; // End of pill
          }
        } else {
          // Regular text node - direct mapping
          return currentRawIndex + offset;
        }
      }

      // Move past this node in raw text space
      if (
        parent &&
        parent.hasAttribute('data-token-start') &&
        parent.hasAttribute('data-token-end')
      ) {
        // This is a pill - use its raw length
        const tokenStart = parseInt(
          parent.getAttribute('data-token-start') || '0'
        );
        const tokenEnd = parseInt(parent.getAttribute('data-token-end') || '0');
        const rawLength = tokenEnd - tokenStart;
        currentRawIndex += rawLength;
      } else {
        // Regular text - use visual length
        currentRawIndex += textContent.length;
      }
    }

    currentNode = walker.nextNode();
  }

  return null;
}
