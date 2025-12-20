/**
 * Lexical Rich Text Editor Module
 *
 * A comprehensive rich text editor built on Meta's Lexical framework.
 * Provides support for:
 * - Hashtags with search and filtering
 * - Structured mentions (@[username|userId|filterType])
 * - URL pills with behavior controls (embed/link/modal)
 * - Custom emoji support with database integration
 * - Markdown formatting
 * - Multiline editing with proper cursor handling
 *
 * ## Installation
 *
 * Before using this module, install the required Lexical packages:
 *
 * ```bash
 * pnpm add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/markdown @lexical/history @lexical/selection @lexical/utils
 * ```
 *
 * @module lexical-editor
 */

// Core editor components
export { LexicalRichEditor } from './components/LexicalRichEditor';
export type {
  LexicalRichEditorProps,
  LexicalRichEditorRef
} from './components/LexicalRichEditor';

// Clean standalone editor (recommended)
export { LexicalTextEditor } from './components/LexicalTextEditor';
export type {
  LexicalTextEditorProps,
  LexicalTextEditorRef
} from './components/LexicalTextEditor';

// Custom nodes
export {
  HashtagNode,
  $createHashtagNode,
  $isHashtagNode
} from './nodes/HashtagNode';
export type { HashtagPayload, SerializedHashtagNode } from './nodes/HashtagNode';

export {
  MentionNode,
  $createMentionNode,
  $isMentionNode
} from './nodes/MentionNode';
export type { MentionPayload, SerializedMentionNode } from './nodes/MentionNode';

export {
  URLPillNode,
  $createURLPillNode,
  $isURLPillNode
} from './nodes/URLPillNode';
export type { URLPillPayload, SerializedURLPillNode } from './nodes/URLPillNode';

export {
  EmojiNode,
  $createEmojiNode,
  $isEmojiNode
} from './nodes/EmojiNode';
export type { EmojiPayload, SerializedEmojiNode } from './nodes/EmojiNode';

// Plugins (placeholders - to be implemented in Phase 3)
// export { HashtagPlugin } from './plugins/HashtagPlugin';
// export { MentionPlugin } from './plugins/MentionPlugin';
// export { URLAutoConvertPlugin } from './plugins/URLAutoConvertPlugin';
// export { EmojiPlugin } from './plugins/EmojiPlugin';

// Theme
export { lexicalTheme } from './theme/lexicalTheme';
export type { LexicalTheme } from './theme/lexicalTheme';

// Utilities
export {
  serializeToRawFormat,
  deserializeFromRawFormat,
  serializeMention,
  deserializeMention,
  serializeURLPill,
  deserializeURLPill,
  serializeEmoji,
  deserializeEmoji,
  serializeHashtag,
  deserializeHashtag,
  parseRawText
} from './utils/serialization';
export type { ParsedToken } from './utils/serialization';

// Types
export type {
  MentionData,
  URLPillData,
  URLBehavior,
  URLWidth,
  EmojiData,
  HashtagData,
  LexicalEditorConfig,
  LexicalEditorEventHandlers,
  HashtagSearchResult,
  MentionSearchResult,
  EmojiSearchResult,
  SerializedContent
} from './types';

