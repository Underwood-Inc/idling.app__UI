/**
 * Zero-dependency Emoji Parser with Custom Emoji Support
 * Scalable and secure solution for parsing standard and custom emojis
 */

import { createLogger } from '@/lib/logging';

const logger = createLogger({
  component: 'EmojiParser',
  module: 'parsers'
});

export interface EmojiDefinition {
  id: string;
  name: string;
  unicode?: string; // For standard emojis
  imageUrl?: string; // For custom emojis
  category: string;
  tags: string[];
  aliases: string[]; // Alternative names like :smile: vs :grinning:
}

export interface EmojiToken {
  type: 'emoji';
  id: string;
  name: string;
  unicode?: string;
  imageUrl?: string;
  start: number;
  end: number;
  rawText: string; // Original :emoji_name: text
}

export class EmojiRegistry {
  private static instance: EmojiRegistry;
  private emojis: Map<string, EmojiDefinition> = new Map();
  private aliases: Map<string, string> = new Map(); // alias -> id mapping

  private constructor() {
    this.loadStandardEmojis();
  }

  static getInstance(): EmojiRegistry {
    if (!EmojiRegistry.instance) {
      EmojiRegistry.instance = new EmojiRegistry();
    }
    return EmojiRegistry.instance;
  }

  /**
   * Load standard Unicode emojis
   */
  private loadStandardEmojis(): void {
    const standardEmojis: EmojiDefinition[] = [
      // Faces
      {
        id: 'grinning',
        name: 'grinning',
        unicode: '😀',
        category: 'faces',
        tags: ['happy', 'smile'],
        aliases: ['grinning']
      },
      {
        id: 'smile',
        name: 'smile',
        unicode: '😄',
        category: 'faces',
        tags: ['happy', 'joy'],
        aliases: ['smile', 'happy']
      },
      {
        id: 'joy',
        name: 'joy',
        unicode: '😂',
        category: 'faces',
        tags: ['laugh', 'tears'],
        aliases: ['joy', 'laugh']
      },
      {
        id: 'heart_eyes',
        name: 'heart_eyes',
        unicode: '😍',
        category: 'faces',
        tags: ['love', 'heart'],
        aliases: ['heart_eyes', 'love']
      },
      {
        id: 'wink',
        name: 'wink',
        unicode: '😉',
        category: 'faces',
        tags: ['flirt', 'wink'],
        aliases: ['wink']
      },
      {
        id: 'thinking',
        name: 'thinking',
        unicode: '🤔',
        category: 'faces',
        tags: ['think', 'hmm'],
        aliases: ['thinking', 'hmm']
      },
      {
        id: 'thumbsup',
        name: 'thumbsup',
        unicode: '👍',
        category: 'gestures',
        tags: ['like', 'good'],
        aliases: ['thumbsup', 'like', 'good']
      },
      {
        id: 'thumbsdown',
        name: 'thumbsdown',
        unicode: '👎',
        category: 'gestures',
        tags: ['dislike', 'bad'],
        aliases: ['thumbsdown', 'dislike', 'bad']
      },
      {
        id: 'clap',
        name: 'clap',
        unicode: '👏',
        category: 'gestures',
        tags: ['applause', 'good'],
        aliases: ['clap', 'applause']
      },
      {
        id: 'wave',
        name: 'wave',
        unicode: '👋',
        category: 'gestures',
        tags: ['hello', 'goodbye'],
        aliases: ['wave', 'hello']
      },

      // Hearts
      {
        id: 'heart',
        name: 'heart',
        unicode: '❤️',
        category: 'hearts',
        tags: ['love', 'red'],
        aliases: ['heart', 'love']
      },
      {
        id: 'blue_heart',
        name: 'blue_heart',
        unicode: '💙',
        category: 'hearts',
        tags: ['love', 'blue'],
        aliases: ['blue_heart']
      },
      {
        id: 'green_heart',
        name: 'green_heart',
        unicode: '💚',
        category: 'hearts',
        tags: ['love', 'green'],
        aliases: ['green_heart']
      },
      {
        id: 'yellow_heart',
        name: 'yellow_heart',
        unicode: '💛',
        category: 'hearts',
        tags: ['love', 'yellow'],
        aliases: ['yellow_heart']
      },
      {
        id: 'purple_heart',
        name: 'purple_heart',
        unicode: '💜',
        category: 'hearts',
        tags: ['love', 'purple'],
        aliases: ['purple_heart']
      },

      // Objects
      {
        id: 'fire',
        name: 'fire',
        unicode: '🔥',
        category: 'objects',
        tags: ['hot', 'flame'],
        aliases: ['fire', 'flame']
      },
      {
        id: 'rocket',
        name: 'rocket',
        unicode: '🚀',
        category: 'objects',
        tags: ['space', 'launch'],
        aliases: ['rocket', 'launch']
      },
      {
        id: 'star',
        name: 'star',
        unicode: '⭐',
        category: 'objects',
        tags: ['favorite', 'good'],
        aliases: ['star', 'favorite']
      },
      {
        id: 'trophy',
        name: 'trophy',
        unicode: '🏆',
        category: 'objects',
        tags: ['win', 'award'],
        aliases: ['trophy', 'win']
      },
      {
        id: 'computer',
        name: 'computer',
        unicode: '💻',
        category: 'objects',
        tags: ['tech', 'work'],
        aliases: ['computer', 'laptop']
      },

      // Nature
      {
        id: 'sun',
        name: 'sun',
        unicode: '☀️',
        category: 'nature',
        tags: ['weather', 'bright'],
        aliases: ['sun', 'sunny']
      },
      {
        id: 'moon',
        name: 'moon',
        unicode: '🌙',
        category: 'nature',
        tags: ['night', 'crescent'],
        aliases: ['moon', 'night']
      },
      {
        id: 'tree',
        name: 'tree',
        unicode: '🌳',
        category: 'nature',
        tags: ['nature', 'green'],
        aliases: ['tree']
      },
      {
        id: 'flower',
        name: 'flower',
        unicode: '🌸',
        category: 'nature',
        tags: ['nature', 'pink'],
        aliases: ['flower', 'blossom']
      }
    ];

    for (const emoji of standardEmojis) {
      this.registerEmoji(emoji);
    }
  }

  /**
   * Register a single emoji with validation
   */
  registerEmoji(emoji: EmojiDefinition): void {
    // Validate emoji name structure
    if (!this.isValidEmojiName(emoji.name)) {
      logger.warn(
        `Invalid emoji name "${emoji.name}" - skipping registration. ` +
          `Emoji names must start with a letter, contain only letters/numbers/underscores, and be 1-32 characters long.`
      );
      return;
    }

    // Validate emoji ID structure
    if (!this.isValidEmojiName(emoji.id)) {
      logger.warn(
        `Invalid emoji ID "${emoji.id}" - skipping registration. Emoji IDs must follow the same naming rules as names.`
      );
      return;
    }

    // Sanitize image URL if present
    if (emoji.imageUrl) {
      emoji.imageUrl = this.sanitizeImageUrl(emoji.imageUrl);
      if (!emoji.imageUrl) {
        logger.warn(
          `Invalid image URL for emoji "${emoji.name}" - skipping registration.`
        );
        return;
      }
    }

    this.emojis.set(emoji.id, emoji);

    // Register aliases with validation
    emoji.aliases.forEach((alias) => {
      if (this.isValidEmojiName(alias)) {
        this.aliases.set(alias, emoji.id);
      } else {
        logger.warn(
          `Invalid emoji alias "${alias}" for emoji "${emoji.name}" - skipping alias.`
        );
      }
    });
  }

  /**
   * Register multiple emojis with validation
   */
  registerEmojis(emojis: EmojiDefinition[]): void {
    emojis.forEach((emoji) => this.registerEmoji(emoji));
  }

  /**
   * Validate emoji name structure (same rules as parser)
   */
  private isValidEmojiName(name: string): boolean {
    if (!name || name.length === 0 || name.length > 32) {
      return false;
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(name)) {
      return false;
    }

    // Can only contain letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return false;
    }

    // Cannot be pure numbers
    if (/^\d+$/.test(name)) {
      return false;
    }

    // Blacklist common URL components
    const urlComponentBlacklist = [
      'http',
      'https',
      'ftp',
      'www',
      'com',
      'org',
      'net',
      'edu',
      'gov',
      'localhost',
      'port',
      'ssl',
      'tls',
      'api',
      'cdn',
      'static',
      '80',
      '443',
      '8080',
      '3000',
      '5000',
      '8000',
      '9000'
    ];

    if (urlComponentBlacklist.includes(name.toLowerCase())) {
      return false;
    }

    // Avoid single character names
    if (name.length === 1) {
      return false;
    }

    return true;
  }

  /**
   * Get emoji by ID or alias
   */
  getEmoji(idOrAlias: string): EmojiDefinition | undefined {
    const normalizedName = idOrAlias.toLowerCase();

    // Try direct ID lookup first
    if (this.emojis.has(normalizedName)) {
      return this.emojis.get(normalizedName);
    }

    // Try alias lookup
    const id = this.aliases.get(normalizedName);
    if (id) {
      return this.emojis.get(id);
    }

    return undefined;
  }

  /**
   * Get all registered emojis
   */
  getAllEmojis(): EmojiDefinition[] {
    return Array.from(this.emojis.values());
  }

  /**
   * Get emojis by category
   */
  getEmojisByCategory(category: string): EmojiDefinition[] {
    return Array.from(this.emojis.values()).filter(
      (emoji) => emoji.category === category
    );
  }

  /**
   * Search emojis by tags or name
   */
  searchEmojis(query: string): EmojiDefinition[] {
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.emojis.values()).filter(
      (emoji) =>
        emoji.name.toLowerCase().includes(normalizedQuery) ||
        emoji.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        emoji.aliases.some((alias) =>
          alias.toLowerCase().includes(normalizedQuery)
        )
    );
  }

  /**
   * Sanitize image URLs for custom emojis
   */
  private sanitizeImageUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // Only allow https URLs
      if (urlObj.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed for custom emojis');
      }

      // Block suspicious domains (you can extend this list)
      const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
      if (blockedDomains.includes(urlObj.hostname)) {
        throw new Error('Blocked domain for custom emoji');
      }

      return url;
    } catch (error) {
      logger.warn('Invalid custom emoji URL', { url, error });
      return ''; // Return empty string for invalid URLs
    }
  }
}

export class EmojiParser {
  // More structured emoji pattern with stricter rules
  private static readonly EMOJI_PATTERN =
    /(?:^|[\s\n\r]|[^\w:])(:[a-zA-Z][a-zA-Z0-9_]{0,31}:)(?=[\s\n\r]|[^\w:]|$)/g;
  private static readonly SIMPLE_EMOJI_PATTERN =
    /:([a-zA-Z][a-zA-Z0-9_]{0,31}):/g;
  private registry: EmojiRegistry;

  constructor() {
    this.registry = EmojiRegistry.getInstance();
  }

  /**
   * Parse text and find emoji tokens with structured validation
   */
  parse(text: string): EmojiToken[] {
    const tokens: EmojiToken[] = [];

    // Use the stricter pattern for better detection
    const pattern = new RegExp(EmojiParser.EMOJI_PATTERN);

    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract the emoji name from the capture group
      const fullMatch = match[1]; // :emoji_name:
      const emojiName = fullMatch.slice(1, -1); // Remove colons

      // Calculate actual positions accounting for the prefix
      const prefixLength = match[0].length - fullMatch.length;
      const matchStart = match.index + prefixLength;
      const matchEnd = matchStart + fullMatch.length;

      // Validate emoji name structure
      if (!this.isValidEmojiName(emojiName)) {
        continue;
      }

      // Skip if this appears to be part of a URL (additional safety check)
      if (this.isPartOfURL(text, matchStart, matchEnd)) {
        continue;
      }

      // Check if emoji exists in registry
      const emoji = this.registry.getEmoji(emojiName);
      if (emoji) {
        tokens.push({
          type: 'emoji',
          id: emoji.id,
          name: emoji.name,
          unicode: emoji.unicode,
          imageUrl: emoji.imageUrl,
          start: matchStart,
          end: matchEnd,
          rawText: fullMatch
        });
      }
    }

    return tokens;
  }

  /**
   * Validate emoji name against structured rules
   */
  private isValidEmojiName(name: string): boolean {
    // Emoji name validation rules:
    // 1. Must start with a letter (not number or special char)
    // 2. Can contain letters, numbers, and underscores only
    // 3. Must be 1-32 characters long
    // 4. Cannot be pure numbers (like port numbers)
    // 5. Cannot match common URL components

    if (!name || name.length === 0 || name.length > 32) {
      return false;
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(name)) {
      return false;
    }

    // Can only contain letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return false;
    }

    // Cannot be pure numbers (port numbers, etc.)
    if (/^\d+$/.test(name)) {
      return false;
    }

    // Blacklist common URL components that might appear in colons
    const urlComponentBlacklist = [
      'http',
      'https',
      'ftp',
      'www',
      'com',
      'org',
      'net',
      'edu',
      'gov',
      'localhost',
      'port',
      'ssl',
      'tls',
      'api',
      'cdn',
      'static',
      '80',
      '443',
      '8080',
      '3000',
      '5000',
      '8000',
      '9000'
    ];

    if (urlComponentBlacklist.includes(name.toLowerCase())) {
      return false;
    }

    // Additional check: avoid single character names that could be URL components
    if (name.length === 1) {
      return false;
    }

    return true;
  }

  /**
   * Enhanced URL detection with more precise context analysis
   */
  private isPartOfURL(text: string, start: number, end: number): boolean {
    // Expand context for better URL detection
    const contextRadius = 100;
    const beforeContext = text.substring(
      Math.max(0, start - contextRadius),
      start
    );
    const afterContext = text.substring(
      end,
      Math.min(text.length, end + contextRadius)
    );

    // More comprehensive URL patterns
    const urlPatterns = [
      /https?:\/\/[^\s]*$/i, // URL prefix
      /ftp:\/\/[^\s]*$/i, // FTP prefix
      /www\.[^\s]*$/i, // www prefix
      /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*$/i, // Domain pattern
      /\/\/[^\s]*$/, // Protocol-relative URLs
      /:\/\/[^\s]*$/ // Any protocol
    ];

    // Check if we're inside a URL
    for (const pattern of urlPatterns) {
      if (pattern.test(beforeContext)) {
        return true;
      }
    }

    // Check for URL continuation patterns after the match
    const urlContinuationPatterns = [
      /^[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]/, // URL characters
      /^\/[^\s]*/, // Path continuation
      /^\?[^\s]*/, // Query parameters
      /^#[^\s]*/ // Fragment
    ];

    for (const pattern of urlContinuationPatterns) {
      if (pattern.test(afterContext)) {
        // Double-check we're actually in a URL context
        if (this.hasUrlContext(beforeContext)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if the context suggests we're in a URL
   */
  private hasUrlContext(context: string): boolean {
    const urlIndicators = [
      /https?:\/\//i,
      /ftp:\/\//i,
      /www\./i,
      /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
      /\/\//
    ];

    return urlIndicators.some((pattern) => pattern.test(context));
  }

  /**
   * Fallback method for simple emoji parsing (for backward compatibility)
   */
  parseSimple(text: string): EmojiToken[] {
    const tokens: EmojiToken[] = [];
    const pattern = new RegExp(EmojiParser.SIMPLE_EMOJI_PATTERN);

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const emojiName = match[1];

      if (!this.isValidEmojiName(emojiName)) {
        continue;
      }

      const emoji = this.registry.getEmoji(emojiName);
      if (emoji) {
        tokens.push({
          type: 'emoji',
          id: emoji.id,
          name: emoji.name,
          unicode: emoji.unicode,
          imageUrl: emoji.imageUrl,
          start: match.index,
          end: match.index + match[0].length,
          rawText: match[0]
        });
      }
    }

    return tokens;
  }

  /**
   * Replace emoji tokens in text with HTML
   */
  replaceEmojisWithHtml(text: string): string {
    const tokens = this.parse(text);
    let result = text;

    // Process tokens in reverse order to maintain correct indices
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];
      let replacement: string;

      if (token.unicode) {
        // Standard Unicode emoji
        replacement = `<span class="emoji emoji--unicode" title=":${token.name}:" data-emoji="${token.id}">${token.unicode}</span>`;
      } else if (token.imageUrl) {
        // Custom emoji with image
        replacement =
          `<img class="emoji emoji--custom" src="${this.escapeHtml(token.imageUrl)}" ` +
          `alt=":${token.name}:" title=":${token.name}:" data-emoji="${token.id}" loading="lazy" />`;
      } else {
        // Fallback - keep original text
        replacement = token.rawText;
      }

      result =
        result.slice(0, token.start) + replacement + result.slice(token.end);
    }

    return result;
  }

  /**
   * Get suggestions for emoji autocomplete
   */
  getSuggestions(query: string, limit: number = 10): EmojiDefinition[] {
    if (!query || query.length < 1) {
      return [];
    }

    const results = this.registry.searchEmojis(query);
    return results.slice(0, limit);
  }

  /**
   * Register custom emojis at runtime
   */
  addCustomEmoji(emoji: EmojiDefinition): void {
    this.registry.registerEmoji(emoji);
  }

  /**
   * Register multiple custom emojis
   */
  addCustomEmojis(emojis: EmojiDefinition[]): void {
    this.registry.registerEmojis(emojis);
  }

  /**
   * Load emojis from database API
   */
  async loadEmojisFromAPI(
    options: {
      includeCustom?: boolean;
      category?: string;
    } = {}
  ): Promise<void> {
    try {
      const params = new URLSearchParams({
        per_page: '1000', // Load all emojis for parsing
        ...(options.includeCustom && { include_custom: 'true' }),
        ...(options.category && { category: options.category })
      });

      const response = await fetch(`/api/emojis?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load emojis from API');
      }

      const data = await response.json();
      const apiEmojis: EmojiDefinition[] = data.emojis.map((emoji: any) => ({
        id: emoji.emoji_id,
        name: emoji.name,
        unicode: emoji.unicode_char,
        imageUrl: emoji.custom_image_url,
        category: emoji.category.name,
        tags: emoji.tags || [],
        aliases: emoji.aliases || []
      }));

      this.registry.registerEmojis(apiEmojis);
    } catch (error) {
      logger.error('Failed to load emojis from API', error);
      // Continue with built-in emojis if API fails
    }
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

// Export singleton instance for easy use
export const emojiParser = new EmojiParser();
export const emojiRegistry = EmojiRegistry.getInstance();
