/**
 * Modular content parsers for different pill types
 * Each parser handles a specific responsibility and can be composed together
 */

import { detectURLsInText, parseURLPill } from '../config/url-pills';

export type SegmentType = 'text' | 'hashtag' | 'mention' | 'url';

export interface ContentSegment {
  type: SegmentType;
  value: string;
  userId?: string; // For mentions, store the resolved user ID
  displayName?: string; // For mentions, store the display username
  filterType?: 'author' | 'mentions'; // For enhanced mentions, store filter type
  behavior?: string; // For URL pills, store the behavior (modal, link, embed)
  rawFormat?: string; // Store the original format for enhanced mentions or URL pills
  start?: number; // Position in original text
  end?: number; // Position in original text
}

export interface ParsedMatch {
  content: string;
  start: number;
  end: number;
  type: SegmentType;
  data?: any; // Additional parsed data specific to the type
}

/**
 * Hashtag Parser
 * Handles: #tagname
 */
export class HashtagParser {
  private static readonly REGEX = /#[a-zA-Z0-9_-]+/g;

  static findMatches(text: string): ParsedMatch[] {
    const matches: ParsedMatch[] = [];
    let match;

    // Reset regex lastIndex
    this.REGEX.lastIndex = 0;

    while ((match = this.REGEX.exec(text)) !== null) {
      matches.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
        type: 'hashtag',
        data: {
          hashtag: match[0].slice(1) // Remove # prefix
        }
      });
    }

    return matches;
  }

  static parseMatch(match: ParsedMatch): ContentSegment {
    return {
      type: 'hashtag',
      value: match.data.hashtag,
      start: match.start,
      end: match.end
    };
  }
}

/**
 * Mention Parser
 * Handles: @[username|userId] or @[username|userId|filterType]
 */
export class MentionParser {
  private static readonly REGEX = /@\[[^\]]+\]/g;

  static findMatches(text: string): ParsedMatch[] {
    const matches: ParsedMatch[] = [];
    let match;

    // Reset regex lastIndex
    this.REGEX.lastIndex = 0;

    while ((match = this.REGEX.exec(text)) !== null) {
      const content = match[0];
      const parsedData = this.parseMentionContent(content);

      if (parsedData) {
        matches.push({
          content,
          start: match.index,
          end: match.index + content.length,
          type: 'mention',
          data: parsedData
        });
      }
    }

    return matches;
  }

  private static parseMentionContent(content: string) {
    // Enhanced format: @[username|userId|filterType]
    const enhancedMatch = content.match(
      /^@\[([^|]+)\|([^|]+)(?:\|([^|]+))?\]$/
    );
    if (enhancedMatch) {
      const [, username, userId, filterType] = enhancedMatch;
      return {
        username,
        userId,
        filterType: (filterType as 'author' | 'mentions') || 'author'
      };
    }

    // Legacy format: @[username|userId]
    const legacyMatch = content.match(/^@\[([^|]+)\|([^\]]+)\]$/);
    if (legacyMatch) {
      const [, username, userId] = legacyMatch;
      return {
        username,
        userId,
        filterType: 'author' as const
      };
    }

    return null;
  }

  static parseMatch(match: ParsedMatch): ContentSegment | null {
    if (!match.data) return null;

    return {
      type: 'mention',
      value: match.data.username,
      userId: match.data.userId,
      displayName: match.data.username,
      filterType: match.data.filterType,
      rawFormat: match.content,
      start: match.start,
      end: match.end
    };
  }
}

/**
 * Structured URL Pill Parser
 * Handles: ![behavior](url)
 */
export class StructuredURLPillParser {
  private static readonly REGEX = /!\[[^\]]+\]\([^)]+\)/g;

  static findMatches(text: string): ParsedMatch[] {
    const matches: ParsedMatch[] = [];
    let match;

    // Reset regex lastIndex
    this.REGEX.lastIndex = 0;

    while ((match = this.REGEX.exec(text)) !== null) {
      const content = match[0];
      const parsedData = parseURLPill(content);

      if (parsedData) {
        matches.push({
          content,
          start: match.index,
          end: match.index + content.length,
          type: 'url',
          data: parsedData
        });
      }
    }

    return matches;
  }

  static parseMatch(match: ParsedMatch): ContentSegment | null {
    if (!match.data) return null;

    return {
      type: 'url',
      value: match.data.url,
      rawFormat: match.content,
      behavior: match.data.behavior,
      start: match.start,
      end: match.end
    };
  }
}

/**
 * Fallback URL Parser
 * Handles: Raw URLs like https://youtube.com/watch?v=abc
 */
export class FallbackURLParser {
  static findMatches(text: string): ParsedMatch[] {
    const detectedUrls = detectURLsInText(text);

    return detectedUrls.map((urlData: any) => ({
      content: text.substring(urlData.start, urlData.end),
      start: urlData.start,
      end: urlData.end,
      type: 'url' as SegmentType,
      data: {
        url: urlData.url,
        domain: urlData.domain,
        replacementPill: urlData.replacementPill
      }
    }));
  }

  static parseMatch(match: ParsedMatch): ContentSegment | null {
    if (!match.data) return null;

    const urlPillData = parseURLPill(match.data.replacementPill);
    if (!urlPillData) return null;

    return {
      type: 'url',
      value: urlPillData.url,
      rawFormat: match.data.replacementPill,
      behavior: urlPillData.behavior,
      start: match.start,
      end: match.end
    };
  }
}

/**
 * Main Content Parser that orchestrates all individual parsers
 */
export class ContentParser {
  /**
   * Parse content with strict precedence:
   * 1. Structured URL Pills (highest priority)
   * 2. Hashtags
   * 3. Mentions
   * 4. Fallback URLs (lowest priority, only in remaining text)
   */
  static parse(text: string): ContentSegment[] {
    const segments: ContentSegment[] = [];

    // Step 1: Find all structured content (high priority)
    const structuredMatches = [
      ...StructuredURLPillParser.findMatches(text),
      ...HashtagParser.findMatches(text),
      ...MentionParser.findMatches(text)
    ];

    // Sort by position to process in order
    structuredMatches.sort((a, b) => a.start - b.start);

    // Step 2: Process structured content and text between them
    let lastIndex = 0;

    for (const match of structuredMatches) {
      // Add text before this match (check for fallback URLs)
      if (match.start > lastIndex) {
        const textBefore = text.slice(lastIndex, match.start);
        this.addTextWithFallbackURLs(textBefore, segments, lastIndex);
      }

      // Add the structured content
      const segment = this.parseStructuredMatch(match);
      if (segment) {
        segments.push(segment);
      }

      lastIndex = match.end;
    }

    // Step 3: Add remaining text with fallback URL detection
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      this.addTextWithFallbackURLs(remainingText, segments, lastIndex);
    }

    return segments;
  }

  private static parseStructuredMatch(
    match: ParsedMatch
  ): ContentSegment | null {
    switch (match.type) {
      case 'hashtag':
        return HashtagParser.parseMatch(match);
      case 'mention':
        return MentionParser.parseMatch(match);
      case 'url':
        return StructuredURLPillParser.parseMatch(match);
      default:
        return null;
    }
  }

  private static addTextWithFallbackURLs(
    text: string,
    segments: ContentSegment[],
    baseOffset: number = 0
  ) {
    if (!text) return;

    const fallbackURLs = FallbackURLParser.findMatches(text);

    if (fallbackURLs.length === 0) {
      // No URLs found, add as plain text
      segments.push({
        type: 'text',
        value: text,
        start: baseOffset,
        end: baseOffset + text.length
      });
      return;
    }

    // Process text with fallback URLs
    let lastUrlEnd = 0;

    for (const urlMatch of fallbackURLs) {
      // Add text before URL
      if (urlMatch.start > lastUrlEnd) {
        const textBefore = text.slice(lastUrlEnd, urlMatch.start);
        if (textBefore) {
          segments.push({
            type: 'text',
            value: textBefore,
            start: baseOffset + lastUrlEnd,
            end: baseOffset + urlMatch.start
          });
        }
      }

      // Add URL as pill
      const urlSegment = FallbackURLParser.parseMatch(urlMatch);
      if (urlSegment) {
        // Adjust positions relative to base offset
        urlSegment.start = baseOffset + urlMatch.start;
        urlSegment.end = baseOffset + urlMatch.end;
        segments.push(urlSegment);
      }

      lastUrlEnd = urlMatch.end;
    }

    // Add remaining text after last URL
    if (lastUrlEnd < text.length) {
      const remainingText = text.slice(lastUrlEnd);
      if (remainingText) {
        segments.push({
          type: 'text',
          value: remainingText,
          start: baseOffset + lastUrlEnd,
          end: baseOffset + text.length
        });
      }
    }
  }
}
