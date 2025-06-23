/**
 * Zero-dependency Rich Text Parser
 * Combines markdown, emoji, and image parsing with existing content parsers
 */

import { ContentParser } from '../content-parsers';
import { EmojiParser } from './emoji-parser';
import { ImageParser } from './image-parser';
import { MarkdownParser, MarkdownToken } from './markdown-parser';

export type RichTextTokenType =
  | 'text'
  | 'hashtag'
  | 'mention'
  | 'url'
  | 'markdown'
  | 'emoji'
  | 'image';

export interface RichTextToken {
  type: RichTextTokenType;
  content: string;
  start: number;
  end: number;
  rawText: string;

  // Type-specific data
  markdownType?: MarkdownToken['type'];
  href?: string; // For links
  emojiId?: string;
  emojiUnicode?: string;
  emojiImageUrl?: string;
  imageAlt?: string;
  imageTitle?: string;
  imageSrc?: string;
  userId?: string; // For mentions
  displayName?: string; // For mentions
  filterType?: 'author' | 'mentions'; // For mentions
  behavior?: string; // For URL pills
}

export interface RichTextConfig {
  enableMarkdown?: boolean;
  enableEmojis?: boolean;
  enableImages?: boolean;
  enableHashtags?: boolean;
  enableMentions?: boolean;
  enableUrls?: boolean;
  imageConfig?: {
    maxWidth?: number;
    maxHeight?: number;
    allowedDomains?: string[];
  };
}

export class RichTextParser {
  private emojiParser: EmojiParser;
  private imageParser: ImageParser;
  private config: Required<RichTextConfig>;

  constructor(config: RichTextConfig = {}) {
    this.config = {
      enableMarkdown: config.enableMarkdown !== false,
      enableEmojis: config.enableEmojis !== false,
      enableImages: config.enableImages !== false,
      enableHashtags: config.enableHashtags !== false,
      enableMentions: config.enableMentions !== false,
      enableUrls: config.enableUrls !== false,
      imageConfig: config.imageConfig || {}
    };

    // MarkdownParser is a static class
    this.emojiParser = new EmojiParser();
    this.imageParser = new ImageParser(this.config.imageConfig);
  }

  /**
   * Parse text with all enabled parsers
   */
  parse(text: string): RichTextToken[] {
    const tokens: RichTextToken[] = [];
    const processedRanges: Array<{ start: number; end: number }> = [];

    // Parse in order of precedence:
    // 1. Images (highest priority - avoid conflicts with markdown links)
    // 2. Existing content parsers (hashtags, mentions, URLs)
    // 3. Markdown (after URLs to avoid conflicts)
    // 4. Emojis (lowest priority - fill remaining text)

    // 1. Parse images first
    if (this.config.enableImages) {
      const imageTokens = this.imageParser.parse(text);
      for (const imageToken of imageTokens) {
        tokens.push({
          type: 'image',
          content: imageToken.alt,
          start: imageToken.start,
          end: imageToken.end,
          rawText: imageToken.rawText,
          imageSrc: imageToken.src,
          imageAlt: imageToken.alt,
          imageTitle: imageToken.title
        });
        processedRanges.push({ start: imageToken.start, end: imageToken.end });
      }
    }

    // 2. Parse existing content types (hashtags, mentions, URLs)
    if (
      this.config.enableHashtags ||
      this.config.enableMentions ||
      this.config.enableUrls
    ) {
      const contentSegments = ContentParser.parse(text);
      for (const segment of contentSegments) {
        if (segment.type === 'text') continue;

        // Skip if overlaps with already processed content
        if (
          this.hasOverlap(segment.start || 0, segment.end || 0, processedRanges)
        ) {
          continue;
        }

        let shouldInclude = false;
        if (segment.type === 'hashtag' && this.config.enableHashtags)
          shouldInclude = true;
        if (segment.type === 'mention' && this.config.enableMentions)
          shouldInclude = true;
        if (segment.type === 'url' && this.config.enableUrls)
          shouldInclude = true;

        if (shouldInclude) {
          tokens.push({
            type: segment.type as RichTextTokenType,
            content: segment.value,
            start: segment.start || 0,
            end: segment.end || 0,
            rawText: segment.rawFormat || segment.value,
            userId: segment.userId,
            displayName: segment.displayName,
            filterType: segment.filterType,
            behavior: segment.behavior,
            href: segment.type === 'url' ? segment.value : undefined
          });
          processedRanges.push({
            start: segment.start || 0,
            end: segment.end || 0
          });
        }
      }
    }

    // 3. Parse markdown in remaining text
    if (this.config.enableMarkdown) {
      const remainingText = this.extractUnprocessedText(text, processedRanges);
      for (const textSegment of remainingText) {
        const markdownTokens = MarkdownParser.parse(textSegment.text);
        for (const mdToken of markdownTokens) {
          if (mdToken.type === 'text') continue;

          const absoluteStart = textSegment.offset + mdToken.start;
          const absoluteEnd = textSegment.offset + mdToken.end;

          tokens.push({
            type: 'markdown',
            content: mdToken.content,
            start: absoluteStart,
            end: absoluteEnd,
            rawText: text.slice(absoluteStart, absoluteEnd),
            markdownType: mdToken.type,
            href: mdToken.href
          });
          processedRanges.push({ start: absoluteStart, end: absoluteEnd });
        }
      }
    }

    // 4. Parse emojis in remaining text
    if (this.config.enableEmojis) {
      const remainingText = this.extractUnprocessedText(text, processedRanges);
      for (const textSegment of remainingText) {
        const emojiTokens = this.emojiParser.parse(textSegment.text);
        for (const emojiToken of emojiTokens) {
          const absoluteStart = textSegment.offset + emojiToken.start;
          const absoluteEnd = textSegment.offset + emojiToken.end;

          tokens.push({
            type: 'emoji',
            content: emojiToken.name,
            start: absoluteStart,
            end: absoluteEnd,
            rawText: emojiToken.rawText,
            emojiId: emojiToken.id,
            emojiUnicode: emojiToken.unicode,
            emojiImageUrl: emojiToken.imageUrl
          });
          processedRanges.push({ start: absoluteStart, end: absoluteEnd });
        }
      }
    }

    // 5. Add text tokens for unprocessed content
    this.addTextTokens(text, tokens, processedRanges);

    // Sort tokens by position
    return tokens.sort((a, b) => a.start - b.start);
  }

  /**
   * Convert rich text tokens to HTML
   */
  tokensToHtml(tokens: RichTextToken[]): string {
    return tokens.map((token) => this.tokenToHtml(token)).join('');
  }

  /**
   * Convert single token to HTML
   */
  private tokenToHtml(token: RichTextToken): string {
    switch (token.type) {
      case 'text': {
        // Handle newlines in text content by converting them to <br /> tags
        const escapedContent = this.escapeHtml(token.content);
        return escapedContent.replace(/\n/g, '<br />');
      }

      case 'hashtag':
        return `<span class="content-pill content-pill--hashtag">#${this.escapeHtml(token.content)}</span>`;

      case 'mention':
        return `<span class="content-pill content-pill--mention">@${this.escapeHtml(token.content)}</span>`;

      case 'url':
        if (token.behavior === 'embed') {
          return `<div class="url-embed" data-url="${this.escapeHtml(token.href || '')}">${this.escapeHtml(token.content)}</div>`;
        }
        return `<a href="${this.escapeHtml(token.href || '#')}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(token.content)}</a>`;

      case 'markdown':
        return this.markdownTokenToHtml(token);

      case 'emoji':
        if (token.emojiUnicode) {
          return `<span class="emoji emoji--unicode" title=":${token.content}:">${token.emojiUnicode}</span>`;
        } else if (token.emojiImageUrl) {
          return (
            `<img class="emoji emoji--custom" src="${this.escapeHtml(token.emojiImageUrl)}" ` +
            `alt=":${token.content}:" title=":${token.content}:" loading="lazy" />`
          );
        }
        return this.escapeHtml(token.rawText);

      case 'image':
        return (
          `<img class="embedded-image" src="${this.escapeHtml(token.imageSrc || '')}" ` +
          `alt="${this.escapeHtml(token.imageAlt || 'Image')}" ` +
          `${token.imageTitle ? `title="${this.escapeHtml(token.imageTitle)}"` : ''} loading="lazy" />`
        );

      default:
        return this.escapeHtml(token.content);
    }
  }

  /**
   * Convert markdown token to HTML
   */
  private markdownTokenToHtml(token: RichTextToken): string {
    switch (token.markdownType) {
      case 'bold':
        return `<strong>${this.escapeHtml(token.content)}</strong>`;
      case 'italic':
        return `<em>${this.escapeHtml(token.content)}</em>`;
      case 'code':
        return `<code>${this.escapeHtml(token.content)}</code>`;
      case 'link':
        return `<a href="${this.escapeHtml(token.href || '#')}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(token.content)}</a>`;
      case 'strikethrough':
        return `<del>${this.escapeHtml(token.content)}</del>`;
      case 'underline':
        return `<u>${this.escapeHtml(token.content)}</u>`;
      case 'blockquote':
        return `<blockquote>${this.escapeHtml(token.content)}</blockquote>`;
      case 'list-item':
        return `<li>${this.escapeHtml(token.content)}</li>`;
      default:
        return this.escapeHtml(token.content);
    }
  }

  /**
   * Replace rich text in string with HTML
   */
  replaceWithHtml(text: string): string {
    const tokens = this.parse(text);
    let result = text;

    // Process tokens in reverse order to maintain correct indices
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];
      const replacement = this.tokenToHtml(token);
      result =
        result.slice(0, token.start) + replacement + result.slice(token.end);
    }

    return result;
  }

  /**
   * Extract unprocessed text segments
   */
  private extractUnprocessedText(
    text: string,
    processedRanges: Array<{ start: number; end: number }>
  ): Array<{ text: string; offset: number }> {
    const segments: Array<{ text: string; offset: number }> = [];
    const sortedRanges = [...processedRanges].sort((a, b) => a.start - b.start);

    let currentIndex = 0;

    for (const range of sortedRanges) {
      if (currentIndex < range.start) {
        const segmentText = text.slice(currentIndex, range.start);
        if (segmentText.trim()) {
          segments.push({ text: segmentText, offset: currentIndex });
        }
      }
      currentIndex = range.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const segmentText = text.slice(currentIndex);
      if (segmentText.trim()) {
        segments.push({ text: segmentText, offset: currentIndex });
      }
    }

    return segments;
  }

  /**
   * Check if ranges overlap
   */
  private hasOverlap(
    start: number,
    end: number,
    ranges: Array<{ start: number; end: number }>
  ): boolean {
    return ranges.some(
      (range) =>
        (start >= range.start && start < range.end) ||
        (end > range.start && end <= range.end) ||
        (start <= range.start && end >= range.end)
    );
  }

  /**
   * Add text tokens for unprocessed content
   */
  private addTextTokens(
    text: string,
    tokens: RichTextToken[],
    processedRanges: Array<{ start: number; end: number }>
  ): void {
    const textSegments = this.extractUnprocessedText(text, processedRanges);

    for (const segment of textSegments) {
      tokens.push({
        type: 'text',
        content: segment.text,
        start: segment.offset,
        end: segment.offset + segment.text.length,
        rawText: segment.text
      });
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RichTextConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.imageConfig) {
      this.imageParser.updateConfig(newConfig.imageConfig);
    }
  }

  /**
   * Add custom emoji
   */
  addCustomEmoji(emoji: {
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    tags: string[];
    aliases: string[];
  }): void {
    this.emojiParser.addCustomEmoji(emoji);
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance with default config
export const richTextParser = new RichTextParser();
