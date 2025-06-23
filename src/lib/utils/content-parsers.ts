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

export interface TokenizedContent {
  // Character-level tokenization
  characters: Array<{
    char: string;
    index: number;
    isWhitespace: boolean;
    isNewline: boolean;
    isPunctuation: boolean;
    segmentIndex: number; // Which segment this character belongs to
    segmentType: SegmentType;
  }>;

  // Word-level tokenization
  words: Array<{
    word: string;
    start: number;
    end: number;
    isWhitespace: boolean;
    segmentIndex: number; // Which segment this word belongs to
    segmentType: SegmentType;
  }>;

  // Pill-level tokenization (hashtags, mentions, URLs)
  pills: Array<{
    type: 'hashtag' | 'mention' | 'url';
    value: string;
    displayValue: string; // What's shown to user (e.g., @username vs @[username|id])
    start: number;
    end: number;
    data: any; // Type-specific data (userId, behavior, etc.)
    segmentIndex: number;
  }>;

  // Original segments for backward compatibility
  segments: ContentSegment[];
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
      value: match.data.hashtag, // Just the tag name without #
      rawFormat: match.content, // Full format with #
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
      type: 'url' as const,
      data: {
        url: urlData.url,
        domain: urlData.domain,
        behavior: urlData.domain.defaultBehavior
      }
    }));
  }

  static parseMatch(match: ParsedMatch): ContentSegment | null {
    if (!match.data) return null;

    return {
      type: 'url',
      value: match.data.url,
      behavior: match.data.behavior,
      rawFormat: match.content, // Add rawFormat so edit controls work
      start: match.start,
      end: match.end
    };
  }
}

/**
 * Main ContentParser class that orchestrates all parsers
 */
export class ContentParser {
  /**
   * Parse content with strict precedence:
   * 1. Structured URL Pills (highest priority)
   * 2. Hashtags and Mentions (equal priority)
   * 3. Fallback URLs (lowest priority, only in remaining text)
   */
  static parse(text: string): ContentSegment[] {
    const segments: ContentSegment[] = [];
    let processedRanges: Array<{ start: number; end: number }> = [];

    // Step 1: Parse structured URL pills first (highest priority)
    const structuredMatches = StructuredURLPillParser.findMatches(text);
    for (const match of structuredMatches) {
      const segment = StructuredURLPillParser.parseMatch(match);
      if (segment) {
        segments.push(segment);
        processedRanges.push({ start: match.start, end: match.end });
      }
    }

    // Step 2: Parse hashtags and mentions in remaining text
    const remainingText = this.extractUnprocessedText(text, processedRanges);
    for (const textChunk of remainingText) {
      // Find hashtags and mentions in this chunk
      const hashtagMatches = HashtagParser.findMatches(textChunk.text);
      const mentionMatches = MentionParser.findMatches(textChunk.text);

      // Combine and sort by position
      const allMatches = [
        ...hashtagMatches.map((m) => ({
          ...m,
          start: m.start + textChunk.offset,
          end: m.end + textChunk.offset
        })),
        ...mentionMatches.map((m) => ({
          ...m,
          start: m.start + textChunk.offset,
          end: m.end + textChunk.offset
        }))
      ].sort((a, b) => a.start - b.start);

      // Process matches
      for (const match of allMatches) {
        const segment = this.parseStructuredMatch(match);
        if (segment) {
          segments.push(segment);
          processedRanges.push({ start: match.start, end: match.end });
        }
      }
    }

    // Step 3: Add fallback URLs in remaining text
    this.addTextWithFallbackURLs(text, segments, processedRanges);

    // Step 4: Add remaining text segments
    this.addTextSegments(text, segments, processedRanges);

    // Sort all segments by position
    return segments.sort((a, b) => (a.start || 0) - (b.start || 0));
  }

  /**
   * Enhanced tokenization that provides character, word, and pill-level tokens
   */
  static tokenize(text: string): TokenizedContent {
    // First get the standard segments
    const segments = this.parse(text);

    // Initialize tokenized content
    const tokenizedContent: TokenizedContent = {
      characters: [],
      words: [],
      pills: [],
      segments
    };

    // Character-level tokenization
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const segmentIndex = this.findSegmentAtIndex(segments, i);
      const segment = segments[segmentIndex] || { type: 'text' as SegmentType };

      tokenizedContent.characters.push({
        char,
        index: i,
        isWhitespace: /\s/.test(char),
        isNewline: char === '\n',
        isPunctuation: /[^\w\s]/.test(char),
        segmentIndex,
        segmentType: segment.type
      });
    }

    // Word-level tokenization
    const wordRegex = /\S+|\s+/g;
    let wordMatch;
    while ((wordMatch = wordRegex.exec(text)) !== null) {
      const word = wordMatch[0];
      const start = wordMatch.index;
      const end = start + word.length;
      const segmentIndex = this.findSegmentAtIndex(segments, start);
      const segment = segments[segmentIndex] || { type: 'text' as SegmentType };

      tokenizedContent.words.push({
        word,
        start,
        end,
        isWhitespace: /^\s+$/.test(word),
        segmentIndex,
        segmentType: segment.type
      });
    }

    // Pill-level tokenization
    segments.forEach((segment, index) => {
      if (segment.type !== 'text') {
        let displayValue = segment.value;
        let data: any = {};

        switch (segment.type) {
          case 'hashtag':
            displayValue = `#${segment.value}`;
            data = { hashtag: segment.value };
            break;
          case 'mention':
            displayValue = `@${segment.value}`;
            data = {
              username: segment.value,
              userId: segment.userId,
              displayName: segment.displayName,
              filterType: segment.filterType
            };
            break;
          case 'url':
            displayValue = segment.value;
            data = {
              url: segment.value,
              behavior: segment.behavior,
              rawFormat: segment.rawFormat
            };
            break;
        }

        tokenizedContent.pills.push({
          type: segment.type as 'hashtag' | 'mention' | 'url',
          value: segment.value,
          displayValue,
          start: segment.start || 0,
          end: segment.end || 0,
          data,
          segmentIndex: index
        });
      }
    });

    return tokenizedContent;
  }

  /**
   * Find which segment contains the character at the given index
   */
  private static findSegmentAtIndex(
    segments: ContentSegment[],
    index: number
  ): number {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment.start !== undefined && segment.end !== undefined) {
        if (index >= segment.start && index < segment.end) {
          return i;
        }
      }
    }
    return -1; // Not found in any segment
  }

  /**
   * Get character at specific position with context
   */
  static getCharacterAt(tokenizedContent: TokenizedContent, index: number) {
    return tokenizedContent.characters.find((char) => char.index === index);
  }

  /**
   * Get word at specific position
   */
  static getWordAt(tokenizedContent: TokenizedContent, index: number) {
    return tokenizedContent.words.find(
      (word) => index >= word.start && index < word.end
    );
  }

  /**
   * Get pill at specific position
   */
  static getPillAt(tokenizedContent: TokenizedContent, index: number) {
    return tokenizedContent.pills.find(
      (pill) => index >= pill.start && index < pill.end
    );
  }

  /**
   * Get all pills of a specific type
   */
  static getPillsByType(
    tokenizedContent: TokenizedContent,
    type: 'hashtag' | 'mention' | 'url'
  ) {
    return tokenizedContent.pills.filter((pill) => pill.type === type);
  }

  /**
   * Get word boundaries for cursor positioning
   */
  static getWordBoundaries(
    tokenizedContent: TokenizedContent,
    index: number
  ): { start: number; end: number } | null {
    const word = this.getWordAt(tokenizedContent, index);
    if (word && !word.isWhitespace) {
      return { start: word.start, end: word.end };
    }
    return null;
  }

  /**
   * Get next/previous word position for navigation
   */
  static getNextWordPosition(
    tokenizedContent: TokenizedContent,
    currentIndex: number
  ): number {
    const words = tokenizedContent.words.filter(
      (w) => !w.isWhitespace && w.start > currentIndex
    );
    return words.length > 0
      ? words[0].start
      : tokenizedContent.characters.length;
  }

  static getPreviousWordPosition(
    tokenizedContent: TokenizedContent,
    currentIndex: number
  ): number {
    const words = tokenizedContent.words.filter(
      (w) => !w.isWhitespace && w.start < currentIndex
    );
    return words.length > 0 ? words[words.length - 1].start : 0;
  }

  /**
   * Get line information for multiline content
   */
  static getLineInfo(
    tokenizedContent: TokenizedContent,
    index: number
  ): {
    lineNumber: number;
    lineStart: number;
    lineEnd: number;
    columnIndex: number;
  } {
    const newlines = tokenizedContent.characters
      .filter((char) => char.isNewline)
      .map((char) => char.index);

    let lineNumber = 0;
    let lineStart = 0;

    for (const newlineIndex of newlines) {
      if (index <= newlineIndex) {
        break;
      }
      lineNumber++;
      lineStart = newlineIndex + 1;
    }

    const nextNewlineIndex = newlines.find((nl) => nl > index);
    const lineEnd =
      nextNewlineIndex !== undefined
        ? nextNewlineIndex
        : tokenizedContent.characters.length;

    return {
      lineNumber,
      lineStart,
      lineEnd,
      columnIndex: index - lineStart
    };
  }

  /**
   * Insert text at a specific position while maintaining tokenization
   */
  static insertText(
    originalText: string,
    insertPosition: number,
    textToInsert: string
  ): { newText: string; newTokenizedContent: TokenizedContent } {
    const newText =
      originalText.slice(0, insertPosition) +
      textToInsert +
      originalText.slice(insertPosition);

    const newTokenizedContent = this.tokenize(newText);

    return { newText, newTokenizedContent };
  }

  /**
   * Delete text range while maintaining tokenization
   */
  static deleteTextRange(
    originalText: string,
    startIndex: number,
    endIndex: number
  ): { newText: string; newTokenizedContent: TokenizedContent } {
    const newText =
      originalText.slice(0, startIndex) + originalText.slice(endIndex);

    const newTokenizedContent = this.tokenize(newText);

    return { newText, newTokenizedContent };
  }

  /**
   * Replace a pill with new text
   */
  static replacePill(
    originalText: string,
    pillIndex: number,
    newText: string
  ): { newText: string; newTokenizedContent: TokenizedContent } {
    const tokenizedContent = this.tokenize(originalText);
    const pill = tokenizedContent.pills[pillIndex];

    if (!pill) {
      throw new Error(`Pill at index ${pillIndex} not found`);
    }

    // Delete the pill and insert new text
    const deletedResult = this.deleteTextRange(
      originalText,
      pill.start,
      pill.end
    );
    const finalResult = this.insertText(
      deletedResult.newText,
      pill.start,
      newText
    );

    return finalResult;
  }

  /**
   * Get selection text and metadata
   */
  static getSelectionInfo(
    tokenizedContent: TokenizedContent,
    startIndex: number,
    endIndex: number
  ): {
    selectedText: string;
    selectedCharacters: typeof tokenizedContent.characters;
    selectedWords: typeof tokenizedContent.words;
    selectedPills: typeof tokenizedContent.pills;
    hasCompletePills: boolean;
  } {
    const selectedCharacters = tokenizedContent.characters.filter(
      (char) => char.index >= startIndex && char.index < endIndex
    );

    const selectedWords = tokenizedContent.words.filter(
      (word) => word.start >= startIndex && word.end <= endIndex
    );

    const selectedPills = tokenizedContent.pills.filter(
      (pill) => pill.start >= startIndex && pill.end <= endIndex
    );

    // Check if selection includes complete pills (not partial)
    const partialPills = tokenizedContent.pills.filter(
      (pill) =>
        (pill.start < startIndex && pill.end > startIndex) ||
        (pill.start < endIndex && pill.end > endIndex)
    );

    return {
      selectedText: selectedCharacters.map((char) => char.char).join(''),
      selectedCharacters,
      selectedWords,
      selectedPills,
      hasCompletePills: partialPills.length === 0
    };
  }

  /**
   * Smart word selection that respects pill boundaries
   */
  static selectWordAt(
    tokenizedContent: TokenizedContent,
    index: number
  ): { start: number; end: number } | null {
    // First check if we're inside a pill
    const pill = this.getPillAt(tokenizedContent, index);
    if (pill) {
      return { start: pill.start, end: pill.end };
    }

    // Otherwise select the word
    const word = this.getWordAt(tokenizedContent, index);
    if (word && !word.isWhitespace) {
      return { start: word.start, end: word.end };
    }

    return null;
  }

  private static parseStructuredMatch(
    match: ParsedMatch
  ): ContentSegment | null {
    switch (match.type) {
      case 'hashtag':
        return HashtagParser.parseMatch(match);
      case 'mention':
        return MentionParser.parseMatch(match);
      default:
        return null;
    }
  }

  private static addTextWithFallbackURLs(
    text: string,
    segments: ContentSegment[],
    processedRanges: Array<{ start: number; end: number }>
  ) {
    const remainingText = this.extractUnprocessedText(text, processedRanges);

    for (const textChunk of remainingText) {
      const urlMatches = FallbackURLParser.findMatches(textChunk.text);

      for (const match of urlMatches) {
        const segment = FallbackURLParser.parseMatch({
          ...match,
          start: match.start + textChunk.offset,
          end: match.end + textChunk.offset
        });

        if (segment) {
          segments.push(segment);
          processedRanges.push({
            start: segment.start || 0,
            end: segment.end || 0
          });
        }
      }
    }
  }

  private static addTextSegments(
    text: string,
    segments: ContentSegment[],
    processedRanges: Array<{ start: number; end: number }>
  ) {
    const textChunks = this.extractUnprocessedText(text, processedRanges);

    for (const chunk of textChunks) {
      // Skip empty chunks
      if (!chunk.text) continue;

      // Create a single text segment for each chunk to preserve spaces and formatting
      // This ensures that spaces, newlines, and other whitespace are maintained
      segments.push({
        type: 'text',
        value: chunk.text,
        start: chunk.offset,
        end: chunk.offset + chunk.text.length
      });
    }
  }

  private static extractUnprocessedText(
    text: string,
    processedRanges: Array<{ start: number; end: number }>
  ): Array<{ text: string; offset: number }> {
    const chunks: Array<{ text: string; offset: number }> = [];
    const sortedRanges = [...processedRanges].sort((a, b) => a.start - b.start);

    let currentIndex = 0;

    for (const range of sortedRanges) {
      if (currentIndex < range.start) {
        chunks.push({
          text: text.slice(currentIndex, range.start),
          offset: currentIndex
        });
      }
      currentIndex = range.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      chunks.push({
        text: text.slice(currentIndex),
        offset: currentIndex
      });
    }

    return chunks;
  }

  /**
   * Enhanced parse method with rich text support
   * Integrates with the new rich text parser system
   */
  static parseWithRichText(
    text: string,
    options: {
      enableMarkdown?: boolean;
      enableEmojis?: boolean;
      enableImages?: boolean;
    } = {}
  ): ContentSegment[] {
    // Import rich text parser dynamically to avoid circular dependencies
    const segments = this.parse(text);

    // If rich text features are disabled, return basic segments
    if (
      !options.enableMarkdown &&
      !options.enableEmojis &&
      !options.enableImages
    ) {
      return segments;
    }

    // Add metadata for rich text processing
    return segments.map((segment) => ({
      ...segment,
      richTextEnabled: true,
      richTextOptions: options
    }));
  }
}

/**
 * Helper function to render content with pills
 */
export function renderContentWithPills(content: string): string {
  const segments = ContentParser.parse(content);

  return segments
    .map((segment) => {
      switch (segment.type) {
        case 'hashtag':
          return `<span class="content-pill content-pill--hashtag">#${segment.value}</span>`;
        case 'mention':
          return `<span class="content-pill content-pill--mention">@${segment.displayName || segment.value}</span>`;
        case 'url':
          if (segment.behavior === 'embed') {
            return `<div class="url-embed" data-url="${segment.value}">${segment.value}</div>`;
          }
          return `<a href="${segment.value}" target="_blank" rel="noopener noreferrer">${segment.value}</a>`;
        case 'text':
        default:
          return segment.value;
      }
    })
    .join('');
}

/**
 * Helper function to render content with rich text support
 */
export function renderRichContent(
  content: string,
  options: {
    enableMarkdown?: boolean;
    enableEmojis?: boolean;
    enableImages?: boolean;
    enableHashtags?: boolean;
    enableMentions?: boolean;
    enableUrls?: boolean;
  } = {}
): string {
  // Import rich text parser dynamically
  try {
    const { richTextParser } = require('./parsers/rich-text-parser');
    const parser = richTextParser;

    // Update parser config
    parser.updateConfig({
      enableMarkdown: options.enableMarkdown,
      enableEmojis: options.enableEmojis,
      enableImages: options.enableImages,
      enableHashtags: options.enableHashtags,
      enableMentions: options.enableMentions,
      enableUrls: options.enableUrls
    });

    return parser.replaceWithHtml(content);
  } catch (error) {
    console.warn(
      'Rich text parser not available, falling back to basic parsing:',
      error
    );
    return renderContentWithPills(content);
  }
}
