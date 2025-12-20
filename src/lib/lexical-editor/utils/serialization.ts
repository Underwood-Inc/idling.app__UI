/**
 * Serialization utilities for Lexical editor content
 *
 * These functions convert between Lexical editor state and the raw text format
 * used throughout the codebase. This ensures compatibility with existing
 * content storage and rendering systems.
 *
 * Raw format examples:
 * - Hashtags: #tagname
 * - Mentions: @[username|userId|filterType]
 * - URL Pills: ![behavior|width](url) or ![behavior](url)
 * - Emojis: :emoji_name:
 */

import type {
  MentionData,
  URLPillData,
  EmojiData,
  SerializedContent
} from '../types';

/**
 * Serialize a mention to the raw format
 * Format: @[displayName|userId|filterType]
 */
export function serializeMention(mention: MentionData): string {
  return `@[${mention.displayName}|${mention.userId}|${mention.filterType}]`;
}

/**
 * Deserialize a mention from the raw format
 * Pattern: @[displayName|userId|filterType]
 */
export function deserializeMention(raw: string): MentionData | null {
  const match = raw.match(/^@\[([^|]+)\|([^|]+)\|([^|\]]+)\]$/);
  if (!match) {
    // Try legacy format: @[displayName|userId]
    const legacyMatch = raw.match(/^@\[([^|]+)\|([^\]]+)\]$/);
    if (legacyMatch) {
      return {
        displayName: legacyMatch[1],
        userId: legacyMatch[2],
        filterType: 'author'
      };
    }
    return null;
  }

  return {
    displayName: match[1],
    userId: match[2],
    filterType: match[3] as 'author' | 'mentions'
  };
}

/**
 * Serialize a URL pill to the raw format
 * Format: ![behavior|width](url) or ![behavior](url)
 */
export function serializeURLPill(urlPill: URLPillData): string {
  if (urlPill.width && urlPill.width !== 'medium') {
    return `![${urlPill.behavior}|${urlPill.width}](${urlPill.url})`;
  }
  return `![${urlPill.behavior}](${urlPill.url})`;
}

/**
 * Deserialize a URL pill from the raw format
 * Pattern: ![behavior|width](url) or ![behavior](url)
 */
export function deserializeURLPill(raw: string): URLPillData | null {
  // Try format with width: ![behavior|width](url)
  const matchWithWidth = raw.match(/^!\[([^|]+)\|([^\]]+)\]\(([^)]+)\)$/);
  if (matchWithWidth) {
    return {
      behavior: matchWithWidth[1] as URLPillData['behavior'],
      width: matchWithWidth[2] as URLPillData['width'],
      url: matchWithWidth[3]
    };
  }

  // Try format without width: ![behavior](url)
  const matchSimple = raw.match(/^!\[([^\]]+)\]\(([^)]+)\)$/);
  if (matchSimple) {
    return {
      behavior: matchSimple[1] as URLPillData['behavior'],
      width: 'medium',
      url: matchSimple[2]
    };
  }

  return null;
}

/**
 * Serialize an emoji to the raw format
 * Format: :emoji_name:
 */
export function serializeEmoji(emoji: EmojiData): string {
  return `:${emoji.name}:`;
}

/**
 * Deserialize an emoji from the raw format
 * Pattern: :emoji_name:
 */
export function deserializeEmoji(raw: string): string | null {
  const match = raw.match(/^:([a-zA-Z][a-zA-Z0-9_]{0,31}):$/);
  return match ? match[1] : null;
}

/**
 * Serialize a hashtag to the raw format
 * Format: #tagname
 */
export function serializeHashtag(tag: string): string {
  return `#${tag}`;
}

/**
 * Deserialize a hashtag from the raw format
 * Pattern: #tagname
 */
export function deserializeHashtag(raw: string): string | null {
  const match = raw.match(/^#([a-zA-Z0-9_-]+)$/);
  return match ? match[1] : null;
}

/**
 * Convert Lexical editor JSON state to raw text format
 * This is the main function used when saving editor content
 */
export function serializeToRawFormat(editorState: string): SerializedContent {
  try {
    const state = JSON.parse(editorState);
    let rawText = '';
    let plainText = '';

    // Traverse the editor state tree
    const processNode = (node: any): void => {
      if (!node) return;

      switch (node.type) {
        case 'text':
          rawText += node.text || '';
          plainText += node.text || '';
          break;

        case 'paragraph':
        case 'root':
          if (node.children) {
            node.children.forEach(processNode);
          }
          // Add newline after paragraph (except for root)
          if (node.type === 'paragraph') {
            rawText += '\n';
            plainText += '\n';
          }
          break;

        case 'hashtag':
          const hashtagText = serializeHashtag(node.tag);
          rawText += hashtagText;
          plainText += hashtagText;
          break;

        case 'mention':
          const mentionText = serializeMention({
            displayName: node.displayName,
            userId: node.userId,
            filterType: node.filterType
          });
          rawText += mentionText;
          plainText += `@${node.displayName}`;
          break;

        case 'url-pill':
          const urlText = serializeURLPill({
            url: node.url,
            behavior: node.behavior,
            width: node.width
          });
          rawText += urlText;
          plainText += node.url;
          break;

        case 'emoji':
          const emojiText = serializeEmoji({
            emojiId: node.emojiId,
            name: node.name,
            unicode: node.unicode,
            imageUrl: node.imageUrl
          });
          rawText += emojiText;
          plainText += node.unicode || emojiText;
          break;

        case 'linebreak':
          rawText += '\n';
          plainText += '\n';
          break;

        default:
          // Process children for unknown nodes
          if (node.children) {
            node.children.forEach(processNode);
          }
          break;
      }
    };

    if (state.root) {
      processNode(state.root);
    }

    // Trim trailing newlines
    rawText = rawText.replace(/\n+$/, '');
    plainText = plainText.replace(/\n+$/, '');

    return { rawText, plainText };
  } catch (error) {
    console.error('Failed to serialize editor state:', error);
    return { rawText: '', plainText: '' };
  }
}

/**
 * Convert raw text format to Lexical editor JSON state
 * This is the main function used when loading editor content
 */
export function deserializeFromRawFormat(rawText: string): string {
  // This creates a basic Lexical editor state from raw text
  // The actual parsing of hashtags, mentions, etc. is handled by the editor's
  // transform listeners when the content is loaded

  const paragraphs = rawText.split('\n');

  const children = paragraphs.map((paragraph) => ({
    type: 'paragraph',
    children: [
      {
        type: 'text',
        text: paragraph,
        detail: 0,
        format: 0,
        mode: 'normal',
        style: ''
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1
  }));

  const editorState = {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    }
  };

  return JSON.stringify(editorState);
}

/**
 * Parse raw text and identify all tokens (hashtags, mentions, URLs, emojis)
 * This is useful for pre-processing content before loading into the editor
 */
export interface ParsedToken {
  type: 'text' | 'hashtag' | 'mention' | 'url-pill' | 'emoji';
  start: number;
  end: number;
  raw: string;
  data?: MentionData | URLPillData | EmojiData | { tag: string };
}

export function parseRawText(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  const patterns: Array<{
    regex: RegExp;
    type: ParsedToken['type'];
    parse: (match: RegExpExecArray) => ParsedToken['data'];
  }> = [
    // URL Pills: ![behavior|width](url) or ![behavior](url)
    {
      regex: /!\[([^|\]]+)(?:\|([^\]]+))?\]\(([^)]+)\)/g,
      type: 'url-pill',
      parse: (match) => ({
        behavior: match[1] as URLPillData['behavior'],
        width: (match[2] as URLPillData['width']) || 'medium',
        url: match[3]
      })
    },
    // Mentions: @[displayName|userId|filterType]
    {
      regex: /@\[([^|]+)\|([^|]+)(?:\|([^|\]]+))?\]/g,
      type: 'mention',
      parse: (match) => ({
        displayName: match[1],
        userId: match[2],
        filterType: (match[3] as MentionData['filterType']) || 'author'
      })
    },
    // Hashtags: #tagname
    {
      regex: /#([a-zA-Z0-9_-]+)/g,
      type: 'hashtag',
      parse: (match) => ({ tag: match[1] })
    },
    // Emojis: :emoji_name:
    {
      regex: /:([a-zA-Z][a-zA-Z0-9_]{0,31}):/g,
      type: 'emoji',
      parse: (match) => ({
        emojiId: match[1],
        name: match[1]
      })
    }
  ];

  // Find all matches
  const allMatches: Array<{
    type: ParsedToken['type'];
    start: number;
    end: number;
    raw: string;
    data: ParsedToken['data'];
  }> = [];

  for (const { regex, type, parse } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        type,
        start: match.index,
        end: match.index + match[0].length,
        raw: match[0],
        data: parse(match)
      });
    }
  }

  // Sort by position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (first one wins)
  const nonOverlapping: typeof allMatches = [];
  let lastEnd = 0;

  for (const match of allMatches) {
    if (match.start >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.end;
    }
  }

  // Build token list including text between matches
  let currentPos = 0;

  for (const match of nonOverlapping) {
    // Add text before this match
    if (match.start > currentPos) {
      tokens.push({
        type: 'text',
        start: currentPos,
        end: match.start,
        raw: text.slice(currentPos, match.start)
      });
    }

    // Add the match
    tokens.push({
      type: match.type,
      start: match.start,
      end: match.end,
      raw: match.raw,
      data: match.data
    });

    currentPos = match.end;
  }

  // Add remaining text
  if (currentPos < text.length) {
    tokens.push({
      type: 'text',
      start: currentPos,
      end: text.length,
      raw: text.slice(currentPos)
    });
  }

  return tokens;
}

