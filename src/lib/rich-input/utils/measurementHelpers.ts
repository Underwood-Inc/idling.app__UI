import type { RichContentToken } from '../types';

// Get accurate character width for monospace font calculations
export function getAccurateCharWidth(contentElement: HTMLElement): number {
  // Create a temporary span with the same styling as the content element
  const tempSpan = document.createElement('span');
  tempSpan.style.position = 'absolute';
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.whiteSpace = 'pre';

  // Copy computed styles from the content element for accuracy
  const computedStyle = window.getComputedStyle(contentElement);
  tempSpan.style.fontSize = computedStyle.fontSize;
  tempSpan.style.fontFamily = computedStyle.fontFamily;
  tempSpan.style.fontWeight = computedStyle.fontWeight;
  tempSpan.style.letterSpacing = computedStyle.letterSpacing;

  // Use 'M' as reference character for monospace measurement
  tempSpan.textContent = 'M';

  document.body.appendChild(tempSpan);
  const width = tempSpan.getBoundingClientRect().width;
  document.body.removeChild(tempSpan);

  return width;
}

export function measureTokenWidthAccurate(
  token: RichContentToken,
  contentElement: HTMLElement
): number {
  // Try to find existing rendered token first
  const existingToken = contentElement.querySelector(
    `[data-token-start="${token.start}"][data-token-end="${token.end}"]`
  ) as HTMLElement;

  if (existingToken) {
    // Use actual rendered width
    return existingToken.offsetWidth;
  }

  // For monospace font calculations
  const getMonospaceCharWidth = (): number => {
    return getAccurateCharWidth(contentElement);
  };

  // For pills (hashtags, mentions, URLs), we still need to measure actual rendered width
  // because they have padding, borders, and other styling
  if (
    token.type === 'hashtag' ||
    token.type === 'mention' ||
    token.type === 'url'
  ) {
    // Create a temporary span with the same styling as the content element
    const tempSpan = document.createElement('span');
    tempSpan.style.position = 'absolute';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'pre';

    // Copy computed styles from the content element for accuracy
    const computedStyle = window.getComputedStyle(contentElement);
    tempSpan.style.fontSize = computedStyle.fontSize;
    tempSpan.style.fontFamily = computedStyle.fontFamily;
    tempSpan.style.fontWeight = computedStyle.fontWeight;
    tempSpan.style.letterSpacing = computedStyle.letterSpacing;

    // Apply appropriate styling based on token type
    if (token.type === 'hashtag') {
      tempSpan.className = 'rich-input-hashtag';
      tempSpan.textContent = token.rawText; // Should include the #
    } else if (token.type === 'mention') {
      tempSpan.className = 'rich-input-mention';
      tempSpan.textContent = token.rawText; // Should include the @
    } else if (token.type === 'url') {
      tempSpan.className = 'rich-input-url';
      tempSpan.textContent = token.rawText;
    }

    document.body.appendChild(tempSpan);
    const width = tempSpan.getBoundingClientRect().width;
    document.body.removeChild(tempSpan);

    return width;
  } else {
    // For text tokens, use monospace character width calculation
    const charWidth = getMonospaceCharWidth();
    return token.rawText.length * charWidth;
  }
}

// Helper function to get visual text for a token
export function getVisualTextForToken(token: RichContentToken): string {
  switch (token.type) {
    case 'hashtag':
      return token.rawText; // #hashtag shows as #hashtag
    case 'mention': {
      // @[username|id|author] shows as @username
      const mentionMatch = token.rawText.match(/^@\[([^|]+)\|/);
      return mentionMatch ? `@${mentionMatch[1]}` : token.rawText;
    }
    case 'url':
      // For URLs, show the full URL text as it appears
      return token.rawText;
    case 'emoji':
      // Emojis show as their unicode representation
      return token.rawText;
    case 'text':
    default:
      return token.rawText;
  }
}
