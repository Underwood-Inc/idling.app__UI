/**
 * Calculate the effective character count for text, excluding temporary image data URLs
 * This is used for character limits where data URLs shouldn't count against the limit
 * @param text The text to count characters for
 * @returns The character count excluding temporary image data URLs
 */
export function getEffectiveCharacterCount(text: string): number {
  if (!text) return 0;

  // Remove temporary image markdown patterns: ![embed|size](data:temp-image;name=filename;data:image/...)
  const tempImageRegex =
    /!\[embed\|(?:small|medium|large|full)\]\(data:temp-image;[^)]+\)/g;
  const textWithoutTempImages = text.replace(tempImageRegex, '');

  return textWithoutTempImages.length;
}

/**
 * Check if text contains temporary images
 * @param text The text to check
 * @returns True if text contains temporary images
 */
export function containsTemporaryImages(text: string): boolean {
  if (!text) return false;

  const tempImageRegex =
    /!\[embed\|(?:small|medium|large|full)\]\(data:temp-image;[^)]+\)/;
  return tempImageRegex.test(text);
}
