/**
 * Type definitions for the Lexical Rich Text Editor
 *
 * These types define the data structures used by custom nodes
 * and plugins in the editor.
 */

/**
 * Data structure for hashtag nodes
 */
export interface HashtagData {
  /** The hashtag text without the # prefix */
  tag: string;
}

/**
 * Data structure for mention nodes
 * Supports the structured format: @[username|userId|filterType]
 */
export interface MentionData {
  /** Display name/username shown to user */
  displayName: string;
  /** Unique user identifier from the database */
  userId: string;
  /** Filter type for search functionality */
  filterType: 'author' | 'mentions';
}

/**
 * URL pill behavior options
 */
export type URLBehavior = 'embed' | 'link' | 'modal';

/**
 * URL pill width options
 */
export type URLWidth = 'small' | 'medium' | 'large' | 'full';

/**
 * Data structure for URL pill nodes
 * Supports the structured format: ![behavior|width](url)
 */
export interface URLPillData {
  /** The URL */
  url: string;
  /** How the URL should be displayed */
  behavior: URLBehavior;
  /** Width of the embed (only applicable for embed behavior) */
  width: URLWidth;
}

/**
 * Data structure for emoji nodes
 */
export interface EmojiData {
  /** Unique emoji identifier */
  emojiId: string;
  /** Emoji name/shortcode */
  name: string;
  /** Unicode character (for standard emojis) */
  unicode?: string;
  /** Image URL (for custom emojis) */
  imageUrl?: string;
}

/**
 * Editor configuration options
 */
export interface LexicalEditorConfig {
  /** Enable/disable hashtag parsing */
  enableHashtags?: boolean;
  /** Enable/disable mention parsing */
  enableMentions?: boolean;
  /** Enable/disable emoji parsing */
  enableEmojis?: boolean;
  /** Enable/disable URL detection and pills */
  enableUrls?: boolean;
  /** Enable/disable markdown shortcuts */
  enableMarkdown?: boolean;
  /** Enable/disable image paste */
  enableImagePaste?: boolean;
  /** Maximum character limit */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the editor is multiline */
  multiline?: boolean;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Mention filter type */
  mentionFilterType?: 'author' | 'mentions';
}

/**
 * Event handlers for editor interactions
 */
export interface LexicalEditorEventHandlers {
  /** Called when content changes */
  onChange?: (rawText: string) => void;
  /** Called when a hashtag is clicked */
  onHashtagClick?: (hashtag: string) => void;
  /** Called when a mention is clicked */
  onMentionClick?: (mention: MentionData) => void;
  /** Called when a URL pill is clicked */
  onURLClick?: (url: string) => void;
  /** Called when the editor gains focus */
  onFocus?: () => void;
  /** Called when the editor loses focus */
  onBlur?: () => void;
}

/**
 * Search result types for autocomplete
 */
export interface HashtagSearchResult {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface MentionSearchResult {
  id: string;
  label: string;
  value: string;
  displayName: string;
  avatar?: string;
}

export interface EmojiSearchResult {
  id: string;
  name: string;
  unicode?: string;
  imageUrl?: string;
  category?: string;
}

/**
 * Serialization format for storing editor content
 * Compatible with the existing raw format used in the codebase
 */
export interface SerializedContent {
  /** Raw text with structured formatting */
  rawText: string;
  /** Plain text without formatting (for search/preview) */
  plainText: string;
}

