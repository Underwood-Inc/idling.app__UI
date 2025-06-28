/**
 * Utility class for extracting structured content from text
 */
export class TextExtractor {
  /**
   * Extract hashtags from text
   * @param text - The text to extract hashtags from
   * @param includeHash - Whether to include the # symbol in results
   * @returns Array of hashtags
   */
  static extractHashtags(text: string, includeHash: boolean = true): string[] {
    if (!text) return [];
    
    const hashtags: string[] = [];
    const hashtagRegex = /#(\w+)/g;
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(includeHash ? match[0] : match[1]);
    }

    return hashtags;
  }

  /**
   * Extract user mentions from structured mention format
   * @param text - The text to extract mentions from
   * @returns Array of user mention objects
   */
  static extractUserMentions(text: string): Array<{
    username: string;
    userId: string;
    filterType?: string;
    fullMatch: string;
  }> {
    if (!text) return [];
    
    const mentions: Array<{
      username: string;
      userId: string;
      filterType?: string;
      fullMatch: string;
    }> = [];
    const mentionRegex = /@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        username: match[1],
        userId: match[2],
        filterType: match[3],
        fullMatch: match[0]
      });
    }

    return mentions;
  }

  /**
   * Extract user IDs only from mentions
   * @param text - The text to extract user IDs from
   * @returns Array of user IDs
   */
  static extractUserIds(text: string): string[] {
    return this.extractUserMentions(text).map(mention => mention.userId);
  }

  /**
   * Extract URLs from text
   * @param text - The text to extract URLs from
   * @returns Array of URLs
   */
  static extractUrls(text: string): string[] {
    if (!text) return [];
    
    const urls: string[] = [];
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[0]);
    }

    return urls;
  }

  /**
   * Extract emoji shortcodes from text
   * @param text - The text to extract emoji shortcodes from
   * @returns Array of emoji shortcodes (without colons)
   */
  static extractEmojiShortcodes(text: string): string[] {
    if (!text) return [];
    
    const emojis: string[] = [];
    const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
    let match;

    while ((match = emojiRegex.exec(text)) !== null) {
      emojis.push(match[1]);
    }

    return emojis;
  }

  /**
   * Extract all structured content from text
   * @param text - The text to analyze
   * @returns Object containing all extracted content
   */
  static extractAll(text: string) {
    return {
      hashtags: this.extractHashtags(text),
      mentions: this.extractUserMentions(text),
      userIds: this.extractUserIds(text),
      urls: this.extractUrls(text),
      emojiShortcodes: this.extractEmojiShortcodes(text)
    };
  }
}

/**
 * Utility class for text manipulation and cursor management
 */
export class TextManipulator {
  /**
   * Insert text at a specific position
   * @param originalText - The original text
   * @param insertText - The text to insert
   * @param position - The position to insert at
   * @returns Object with new text and new cursor position
   */
  static insertAtPosition(
    originalText: string,
    insertText: string,
    position: number
  ): { newText: string; newCursorPosition: number } {
    const before = originalText.substring(0, position);
    const after = originalText.substring(position);
    const newText = before + insertText + after;
    const newCursorPosition = position + insertText.length;

    return { newText, newCursorPosition };
  }

  /**
   * Replace text between two positions
   * @param originalText - The original text
   * @param replaceText - The text to replace with
   * @param startPosition - Start position of replacement
   * @param endPosition - End position of replacement
   * @returns Object with new text and new cursor position
   */
  static replaceBetween(
    originalText: string,
    replaceText: string,
    startPosition: number,
    endPosition: number
  ): { newText: string; newCursorPosition: number } {
    const before = originalText.substring(0, startPosition);
    const after = originalText.substring(endPosition);
    const newText = before + replaceText + after;
    const newCursorPosition = startPosition + replaceText.length;

    return { newText, newCursorPosition };
  }

  /**
   * Find the last occurrence of any trigger character before a position
   * @param text - The text to search in
   * @param position - The position to search before
   * @param triggers - Array of trigger characters to look for
   * @returns Object with trigger info or null
   */
  static findLastTrigger(
    text: string,
    position: number,
    triggers: string[]
  ): { index: number; character: string; query: string } | null {
    const beforeCursor = text.substring(0, position);
    
    const triggerPositions = triggers
      .map(trigger => ({
        index: beforeCursor.lastIndexOf(trigger),
        character: trigger
      }))
      .filter(t => t.index >= 0)
      .sort((a, b) => b.index - a.index);

    if (triggerPositions.length === 0) {
      return null;
    }

    const lastTrigger = triggerPositions[0];
    const query = beforeCursor.substring(lastTrigger.index + 1);

    return {
      index: lastTrigger.index,
      character: lastTrigger.character,
      query
    };
  }
} 