/**
 * Zero-dependency Emoji Parser with Custom Emoji Support
 * Scalable and secure solution for parsing standard and custom emojis
 */

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
   * Register a new emoji (standard or custom)
   */
  registerEmoji(emoji: EmojiDefinition): void {
    // Validate emoji definition
    if (!emoji.id || !emoji.name || !emoji.category) {
      throw new Error(
        'Invalid emoji definition: id, name, and category are required'
      );
    }

    // Security: Sanitize custom image URLs
    if (emoji.imageUrl) {
      emoji.imageUrl = this.sanitizeImageUrl(emoji.imageUrl);
    }

    this.emojis.set(emoji.id, emoji);

    // Register aliases
    for (const alias of emoji.aliases) {
      this.aliases.set(alias.toLowerCase(), emoji.id);
    }
  }

  /**
   * Bulk register multiple emojis
   */
  registerEmojis(emojis: EmojiDefinition[]): void {
    for (const emoji of emojis) {
      this.registerEmoji(emoji);
    }
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
      console.warn('Invalid custom emoji URL:', url, error);
      return ''; // Return empty string for invalid URLs
    }
  }
}

export class EmojiParser {
  private static readonly EMOJI_PATTERN = /:([a-zA-Z0-9_+-]+):/g;
  private registry: EmojiRegistry;

  constructor() {
    this.registry = EmojiRegistry.getInstance();
  }

  /**
   * Parse text and find emoji tokens
   */
  parse(text: string): EmojiToken[] {
    const tokens: EmojiToken[] = [];
    const pattern = new RegExp(EmojiParser.EMOJI_PATTERN);

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const emojiName = match[1];
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
      console.error('Failed to load emojis from API:', error);
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
