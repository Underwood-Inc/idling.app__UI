/**
 * EmojiNode - Custom Lexical node for emojis
 *
 * Supports both Unicode emojis and custom image emojis.
 * Uses the :emoji_name: shortcode syntax.
 */

'use client';

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread
} from 'lexical';

import { DecoratorNode } from 'lexical';
import React from 'react';

import type { EmojiData } from '../types';

export interface EmojiPayload extends EmojiData {
  key?: NodeKey;
}

export type SerializedEmojiNode = Spread<
  EmojiData,
  SerializedLexicalNode
>;

/**
 * EmojiComponent - React component rendered by the EmojiNode
 */
interface EmojiComponentProps {
  data: EmojiData;
  nodeKey: NodeKey;
  onClick?: (data: EmojiData) => void;
}

function EmojiComponent({ data, onClick }: EmojiComponentProps): JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(data);
  };

  // Render Unicode emoji
  if (data.unicode) {
    return (
      <span
        className="emoji emoji--unicode"
        onClick={handleClick}
        data-emoji-id={data.emojiId}
        title={`:${data.name}:`}
        role="img"
        aria-label={data.name}
      >
        {data.unicode}
      </span>
    );
  }

  // Render custom image emoji
  if (data.imageUrl) {
    return (
      <img
        className="emoji emoji--custom"
        src={data.imageUrl}
        alt={`:${data.name}:`}
        title={`:${data.name}:`}
        onClick={handleClick}
        data-emoji-id={data.emojiId}
        loading="lazy"
        style={{
          width: '1.2em',
          height: '1.2em',
          verticalAlign: 'middle',
          objectFit: 'contain'
        }}
      />
    );
  }

  // Fallback - render as shortcode
  return (
    <span
      className="emoji emoji--fallback"
      onClick={handleClick}
      data-emoji-id={data.emojiId}
      title={data.name}
    >
      :{data.name}:
    </span>
  );
}

/**
 * EmojiNode - Lexical DecoratorNode for emojis
 */
export class EmojiNode extends DecoratorNode<JSX.Element> {
  __emojiId: string;
  __name: string;
  __unicode?: string;
  __imageUrl?: string;

  static getType(): string {
    return 'emoji';
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(
      node.__emojiId,
      node.__name,
      node.__unicode,
      node.__imageUrl,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode({
      emojiId: serializedNode.emojiId,
      name: serializedNode.name,
      unicode: serializedNode.unicode,
      imageUrl: serializedNode.imageUrl
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.classList.contains('emoji--unicode')) {
          return {
            conversion: (element: HTMLElement) => {
              const emojiId = element.getAttribute('data-emoji-id');
              const title = element.getAttribute('title') || '';
              const name = title.replace(/^:/, '').replace(/:$/, '');
              const unicode = element.textContent || '';

              if (emojiId && name) {
                return {
                  node: $createEmojiNode({
                    emojiId,
                    name,
                    unicode
                  })
                };
              }
              return null;
            },
            priority: 1
          };
        }
        return null;
      },
      img: (domNode: HTMLElement) => {
        if (domNode.classList.contains('emoji--custom')) {
          return {
            conversion: (element: HTMLElement) => {
              const emojiId = element.getAttribute('data-emoji-id');
              const title = element.getAttribute('title') || '';
              const name = title.replace(/^:/, '').replace(/:$/, '');
              const imageUrl = element.getAttribute('src');

              if (emojiId && name && imageUrl) {
                return {
                  node: $createEmojiNode({
                    emojiId,
                    name,
                    imageUrl
                  })
                };
              }
              return null;
            },
            priority: 1
          };
        }
        return null;
      }
    };
  }

  constructor(
    emojiId: string,
    name: string,
    unicode?: string,
    imageUrl?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__emojiId = emojiId;
    this.__name = name;
    this.__unicode = unicode;
    this.__imageUrl = imageUrl;
  }

  exportJSON(): SerializedEmojiNode {
    return {
      type: 'emoji',
      emojiId: this.__emojiId,
      name: this.__name,
      unicode: this.__unicode,
      imageUrl: this.__imageUrl,
      version: 1
    };
  }

  exportDOM(): DOMExportOutput {
    if (this.__unicode) {
      const element = document.createElement('span');
      element.className = 'emoji emoji--unicode';
      element.setAttribute('data-emoji-id', this.__emojiId);
      element.setAttribute('title', `:${this.__name}:`);
      element.textContent = this.__unicode;
      return { element };
    }

    if (this.__imageUrl) {
      const element = document.createElement('img');
      element.className = 'emoji emoji--custom';
      element.setAttribute('data-emoji-id', this.__emojiId);
      element.setAttribute('src', this.__imageUrl);
      element.setAttribute('alt', `:${this.__name}:`);
      element.setAttribute('title', `:${this.__name}:`);
      element.setAttribute('loading', 'lazy');
      return { element };
    }

    const element = document.createElement('span');
    element.className = 'emoji emoji--fallback';
    element.textContent = `:${this.__name}:`;
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'emoji';
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getData(): EmojiData {
    return {
      emojiId: this.__emojiId,
      name: this.__name,
      unicode: this.__unicode,
      imageUrl: this.__imageUrl
    };
  }

  getEmojiId(): string {
    return this.__emojiId;
  }

  getName(): string {
    return this.__name;
  }

  getUnicode(): string | undefined {
    return this.__unicode;
  }

  getImageUrl(): string | undefined {
    return this.__imageUrl;
  }

  /**
   * Get the raw text format for serialization
   * Format: :emoji_name:
   */
  getTextContent(): string {
    return `:${this.__name}:`;
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return false; // Emojis can be selected with surrounding text
  }

  decorate(): JSX.Element {
    return (
      <EmojiComponent
        data={this.getData()}
        nodeKey={this.__key}
      />
    );
  }
}

/**
 * Create a new EmojiNode
 */
export function $createEmojiNode(payload: EmojiPayload): EmojiNode {
  return new EmojiNode(
    payload.emojiId,
    payload.name,
    payload.unicode,
    payload.imageUrl,
    payload.key
  );
}

/**
 * Check if a node is an EmojiNode
 */
export function $isEmojiNode(
  node: LexicalNode | null | undefined
): node is EmojiNode {
  return node instanceof EmojiNode;
}

