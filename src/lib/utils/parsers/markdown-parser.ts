/**
 * Zero-dependency Markdown Parser
 * Handles common markdown syntax with security in mind
 */

export interface MarkdownToken {
  type:
    | 'text'
    | 'bold'
    | 'italic'
    | 'code'
    | 'link'
    | 'strikethrough'
    | 'underline'
    | 'blockquote'
    | 'list-item';
  content: string;
  href?: string; // For links
  start: number;
  end: number;
}

export class MarkdownParser {
  private static readonly PATTERNS = {
    // Bold: **text** or __text__
    bold: /(\*\*|__)((?:(?!\1)[^*_])+)\1/g,
    // Italic: *text* or _text_ (but not if surrounded by word chars to avoid conflicts)
    italic: /(?<!\w)(\*|_)((?:(?!\1)[^*_])+)\1(?!\w)/g,
    // Code: `code`
    code: /`([^`]+)`/g,
    // Strikethrough: ~~text~~
    strikethrough: /~~([^~]+)~~/g,
    // Underline: __text__ (alternative interpretation)
    underline: /<u>(.*?)<\/u>/g,
    // Links: [text](url) or [text](url "title")
    link: /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g,
    // Blockquote: > text
    blockquote: /^>\s*(.+)$/gm,
    // List items: - item or * item or + item
    listItem: /^[\s]*[-*+]\s+(.+)$/gm
  };

  /**
   * Parse markdown text into tokens with precedence handling
   */
  static parse(text: string): MarkdownToken[] {
    const tokens: MarkdownToken[] = [];
    const processedRanges: Array<{ start: number; end: number }> = [];

    // Process in order of precedence (code first to avoid conflicts)
    const parseOrder = [
      'code',
      'link',
      'bold',
      'italic',
      'strikethrough',
      'underline',
      'blockquote',
      'listItem'
    ] as const;

    for (const patternName of parseOrder) {
      const pattern = this.PATTERNS[patternName];
      pattern.lastIndex = 0; // Reset regex

      let match;
      while ((match = pattern.exec(text)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;

        // Skip if this range overlaps with already processed content
        if (this.hasOverlap(start, end, processedRanges)) {
          continue;
        }

        let token: MarkdownToken;

        switch (patternName) {
          case 'code':
            token = {
              type: 'code',
              content: match[1],
              start,
              end
            };
            break;
          case 'link':
            token = {
              type: 'link',
              content: match[1], // Link text
              href: this.sanitizeUrl(match[2]), // URL
              start,
              end
            };
            break;
          case 'bold':
            token = {
              type: 'bold',
              content: match[2],
              start,
              end
            };
            break;
          case 'italic':
            token = {
              type: 'italic',
              content: match[2],
              start,
              end
            };
            break;
          case 'strikethrough':
            token = {
              type: 'strikethrough',
              content: match[1],
              start,
              end
            };
            break;
          case 'underline':
            token = {
              type: 'underline',
              content: match[1],
              start,
              end
            };
            break;
          case 'blockquote':
            token = {
              type: 'blockquote',
              content: match[1],
              start,
              end
            };
            break;
          case 'listItem':
            token = {
              type: 'list-item',
              content: match[1],
              start,
              end
            };
            break;
          default:
            continue;
        }

        tokens.push(token);
        processedRanges.push({ start, end });
      }
    }

    // Add text tokens for unprocessed content
    this.addTextTokens(text, tokens, processedRanges);

    // Sort tokens by position
    return tokens.sort((a, b) => a.start - b.start);
  }

  /**
   * Check if two ranges overlap
   */
  private static hasOverlap(
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
   * Add text tokens for content that wasn't processed by other patterns
   */
  private static addTextTokens(
    text: string,
    tokens: MarkdownToken[],
    processedRanges: Array<{ start: number; end: number }>
  ): void {
    // Sort processed ranges by start position
    const sortedRanges = [...processedRanges].sort((a, b) => a.start - b.start);

    let currentIndex = 0;

    for (const range of sortedRanges) {
      // Add text before this range
      if (currentIndex < range.start) {
        const textContent = text.slice(currentIndex, range.start);
        if (textContent.trim()) {
          tokens.push({
            type: 'text',
            content: textContent,
            start: currentIndex,
            end: range.start
          });
        }
      }
      currentIndex = range.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const textContent = text.slice(currentIndex);
      if (textContent.trim()) {
        tokens.push({
          type: 'text',
          content: textContent,
          start: currentIndex,
          end: text.length
        });
      }
    }
  }

  /**
   * Sanitize URLs to prevent XSS
   */
  private static sanitizeUrl(url: string): string {
    // Remove any potential javascript: or data: schemes
    const trimmed = url.trim();

    // Allow only http, https, mailto, and relative URLs
    const allowedProtocols = /^(https?:\/\/|mailto:|\/|\.\/|\.\.\/)/i;

    if (!allowedProtocols.test(trimmed)) {
      // If no protocol, assume https
      return `https://${trimmed}`;
    }

    // Block dangerous protocols
    const dangerousProtocols = /^(javascript:|data:|vbscript:|file:)/i;
    if (dangerousProtocols.test(trimmed)) {
      return '#'; // Safe fallback
    }

    return trimmed;
  }

  /**
   * Convert tokens back to HTML (for rendering)
   */
  static tokensToHtml(tokens: MarkdownToken[]): string {
    return tokens
      .map((token) => {
        switch (token.type) {
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
          case 'text':
          default:
            return this.escapeHtml(token.content);
        }
      })
      .join('');
  }

  /**
   * Escape HTML to prevent XSS
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
