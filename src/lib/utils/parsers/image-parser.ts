/**
 * Zero-dependency Image Parser for Secure Image Embeds
 * Supports various image formats with security and performance in mind
 */

export interface ImageToken {
  type: 'image';
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  start: number;
  end: number;
  rawText: string;
  format: 'markdown' | 'html' | 'custom';
}

export interface ImageConfig {
  maxWidth?: number;
  maxHeight?: number;
  allowedDomains?: string[];
  allowedExtensions?: string[];
  lazyLoading?: boolean;
  placeholder?: string;
}

export class ImageParser {
  private config: Required<ImageConfig>;

  // Supported image formats
  private static readonly DEFAULT_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'bmp',
    'ico'
  ];

  // Common CDN domains that are generally safe
  private static readonly DEFAULT_ALLOWED_DOMAINS = [
    'imgur.com',
    'i.imgur.com',
    'github.com',
    'raw.githubusercontent.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'picsum.photos',
    'via.placeholder.com',
    'placehold.co',
    'images.unsplash.com',
    'source.unsplash.com'
  ];

  // Patterns for different image embed formats
  private static readonly PATTERNS = {
    // Markdown: ![alt text](url "optional title")
    markdown: /!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,
    // HTML: <img src="url" alt="alt" title="title" />
    html: /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi,
    // Custom format: {img:url|alt|title|width|height}
    custom: /\{img:([^|]+)(?:\|([^|]*))(?:\|([^|]*))(?:\|(\d+))(?:\|(\d+))?\}/g
  };

  constructor(config: ImageConfig = {}) {
    this.config = {
      maxWidth: config.maxWidth || 800,
      maxHeight: config.maxHeight || 600,
      allowedDomains:
        config.allowedDomains || ImageParser.DEFAULT_ALLOWED_DOMAINS,
      allowedExtensions:
        config.allowedExtensions || ImageParser.DEFAULT_EXTENSIONS,
      lazyLoading: config.lazyLoading !== false, // Default to true
      placeholder: config.placeholder || ''
    };
  }

  /**
   * Parse text and find image tokens
   */
  parse(text: string): ImageToken[] {
    const tokens: ImageToken[] = [];

    // Parse markdown images
    tokens.push(...this.parseMarkdownImages(text));

    // Parse HTML images (if not overlapping with markdown)
    tokens.push(...this.parseHtmlImages(text, tokens));

    // Parse custom format images (if not overlapping)
    tokens.push(...this.parseCustomImages(text, tokens));

    // Sort by position and remove overlaps
    return this.removeDuplicates(tokens.sort((a, b) => a.start - b.start));
  }

  /**
   * Parse markdown format images: ![alt](url "title")
   */
  private parseMarkdownImages(text: string): ImageToken[] {
    const tokens: ImageToken[] = [];
    const pattern = new RegExp(ImageParser.PATTERNS.markdown);

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, alt, url, title] = match;

      if (this.isValidImageUrl(url)) {
        tokens.push({
          type: 'image',
          src: this.sanitizeUrl(url),
          alt: alt || 'Image',
          title: title || undefined,
          start: match.index,
          end: match.index + fullMatch.length,
          rawText: fullMatch,
          format: 'markdown'
        });
      }
    }

    return tokens;
  }

  /**
   * Parse HTML img tags
   */
  private parseHtmlImages(
    text: string,
    existingTokens: ImageToken[]
  ): ImageToken[] {
    const tokens: ImageToken[] = [];
    const pattern = new RegExp(ImageParser.PATTERNS.html);

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const src = match[1];

      // Skip if overlaps with existing tokens
      if (
        this.hasOverlap(
          match.index,
          match.index + fullMatch.length,
          existingTokens
        )
      ) {
        continue;
      }

      if (this.isValidImageUrl(src)) {
        // Extract other attributes
        const alt = this.extractAttribute(fullMatch, 'alt') || 'Image';
        const title = this.extractAttribute(fullMatch, 'title');
        const width = this.extractAttribute(fullMatch, 'width');
        const height = this.extractAttribute(fullMatch, 'height');

        tokens.push({
          type: 'image',
          src: this.sanitizeUrl(src),
          alt,
          title: title || undefined,
          width: width ? parseInt(width, 10) : undefined,
          height: height ? parseInt(height, 10) : undefined,
          start: match.index,
          end: match.index + fullMatch.length,
          rawText: fullMatch,
          format: 'html'
        });
      }
    }

    return tokens;
  }

  /**
   * Parse custom format: {img:url|alt|title|width|height}
   */
  private parseCustomImages(
    text: string,
    existingTokens: ImageToken[]
  ): ImageToken[] {
    const tokens: ImageToken[] = [];
    const pattern = new RegExp(ImageParser.PATTERNS.custom);

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [fullMatch, url, alt, title, width, height] = match;

      // Skip if overlaps with existing tokens
      if (
        this.hasOverlap(
          match.index,
          match.index + fullMatch.length,
          existingTokens
        )
      ) {
        continue;
      }

      if (this.isValidImageUrl(url)) {
        tokens.push({
          type: 'image',
          src: this.sanitizeUrl(url),
          alt: alt || 'Image',
          title: title || undefined,
          width: width ? parseInt(width, 10) : undefined,
          height: height ? parseInt(height, 10) : undefined,
          start: match.index,
          end: match.index + fullMatch.length,
          rawText: fullMatch,
          format: 'custom'
        });
      }
    }

    return tokens;
  }

  /**
   * Check if URL is a valid image
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);

      // Check if domain is allowed
      if (this.config.allowedDomains.length > 0) {
        const isAllowedDomain = this.config.allowedDomains.some(
          (domain) =>
            urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowedDomain) {
          console.warn('Image domain not allowed:', urlObj.hostname);
          return false;
        }
      }

      // Check file extension
      const pathname = urlObj.pathname.toLowerCase();
      const hasValidExtension = this.config.allowedExtensions.some((ext) =>
        pathname.endsWith(`.${ext}`)
      );

      if (!hasValidExtension) {
        console.warn('Image extension not allowed:', pathname);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Invalid image URL:', url, error);
      return false;
    }
  }

  /**
   * Sanitize and normalize URL
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.href);

      // Ensure HTTPS for external URLs
      if (
        urlObj.hostname !== window.location.hostname &&
        urlObj.protocol === 'http:'
      ) {
        urlObj.protocol = 'https:';
      }

      return urlObj.toString();
    } catch (error) {
      console.warn('Failed to sanitize URL:', url, error);
      return '';
    }
  }

  /**
   * Extract attribute from HTML string
   */
  private extractAttribute(html: string, attrName: string): string | null {
    const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Check if ranges overlap
   */
  private hasOverlap(
    start: number,
    end: number,
    tokens: ImageToken[]
  ): boolean {
    return tokens.some(
      (token) =>
        (start >= token.start && start < token.end) ||
        (end > token.start && end <= token.end) ||
        (start <= token.start && end >= token.end)
    );
  }

  /**
   * Remove duplicate/overlapping tokens
   */
  private removeDuplicates(tokens: ImageToken[]): ImageToken[] {
    const result: ImageToken[] = [];

    for (const token of tokens) {
      const hasOverlap = result.some((existing) =>
        this.hasOverlap(token.start, token.end, [existing])
      );

      if (!hasOverlap) {
        result.push(token);
      }
    }

    return result;
  }

  /**
   * Convert image tokens to HTML
   */
  tokensToHtml(tokens: ImageToken[]): string {
    return tokens.map((token) => this.tokenToHtml(token)).join('');
  }

  /**
   * Convert single image token to HTML
   */
  tokenToHtml(token: ImageToken): string {
    const attributes: string[] = [
      `src="${this.escapeHtml(token.src)}"`,
      `alt="${this.escapeHtml(token.alt)}"`,
      'class="embedded-image"'
    ];

    if (token.title) {
      attributes.push(`title="${this.escapeHtml(token.title)}"`);
    }

    // Apply size constraints
    const width = token.width
      ? Math.min(token.width, this.config.maxWidth)
      : this.config.maxWidth;
    const height = token.height
      ? Math.min(token.height, this.config.maxHeight)
      : undefined;

    attributes.push(`style="max-width: ${width}px; height: auto;"`);

    if (height) {
      attributes.push(`style="max-height: ${height}px;"`);
    }

    if (this.config.lazyLoading) {
      attributes.push('loading="lazy"');
    }

    return `<img ${attributes.join(' ')} />`;
  }

  /**
   * Replace image tokens in text with HTML
   */
  replaceImagesWithHtml(text: string): string {
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
   * Update configuration
   */
  updateConfig(newConfig: Partial<ImageConfig>): void {
    this.config = { ...this.config, ...newConfig };
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
export const imageParser = new ImageParser();
