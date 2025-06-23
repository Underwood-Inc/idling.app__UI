/**
 * Utilities for cleaning up content for social media sharing
 * Removes or converts embed pills to clean, shareable text
 */

/**
 * Clean content for social media sharing by handling embed pills
 * Option 1: Convert embed pills to clean URLs
 * Option 2: Remove embed pills entirely
 */
export function cleanContentForSocialSharing(
  content: string,
  options: {
    convertEmbedsToUrls?: boolean; // If true, convert ![embed](url) to just url
    removeEmbeds?: boolean; // If true, remove embed pills entirely
    maxLength?: number; // Maximum length for social descriptions
  } = {}
): string {
  const {
    convertEmbedsToUrls = true,
    removeEmbeds = false,
    maxLength = 160
  } = options;

  if (!content) return '';

  let cleanedContent = content;

  // Handle embed pills: ![behavior](url) or ![behavior|width](url)
  const embedPillRegex = /!\[([^|\]]+)(?:\|([^|\]]+))?\]\(([^)]+)\)/g;

  if (removeEmbeds) {
    // Option 2: Remove embed pills entirely
    cleanedContent = cleanedContent.replace(embedPillRegex, '');
  } else if (convertEmbedsToUrls) {
    // Option 1: Convert embed pills to clean URLs
    cleanedContent = cleanedContent.replace(
      embedPillRegex,
      (match, behavior, width, url) => {
        // Return just the clean URL
        return url;
      }
    );
  }

  // Clean up hashtags and mentions for social sharing (optional)
  // Keep them as-is since they're readable in social media

  // Clean up extra whitespace and newlines
  cleanedContent = cleanedContent
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Truncate to max length if specified
  if (maxLength && cleanedContent.length > maxLength) {
    cleanedContent = cleanedContent.substring(0, maxLength);

    // Try to break at a word boundary
    const lastSpace = cleanedContent.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      cleanedContent = cleanedContent.substring(0, lastSpace);
    }

    cleanedContent += '...';
  }

  return cleanedContent;
}

/**
 * Extract URLs from embed pills for rich social media previews
 * Returns an array of URLs found in embed pills
 */
export function extractEmbedUrls(content: string): string[] {
  if (!content) return [];

  const embedPillRegex = /!\[([^|\]]+)(?:\|([^|\]]+))?\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let match;

  while ((match = embedPillRegex.exec(content)) !== null) {
    const url = match[3];
    if (url && isValidUrl(url)) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Simple URL validation
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the first YouTube URL from embed pills for enhanced social sharing
 */
export function getFirstYouTubeUrl(content: string): string | null {
  const urls = extractEmbedUrls(content);

  for (const url of urls) {
    if (isYouTubeUrl(url)) {
      return url;
    }
  }

  return null;
}

/**
 * Check if URL is a YouTube URL
 */
function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes('youtube.com') || hostname.includes('youtu.be');
  } catch {
    return false;
  }
}
