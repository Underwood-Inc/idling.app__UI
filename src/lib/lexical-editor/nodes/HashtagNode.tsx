/**
 * HashtagNode - Custom Lexical node for hashtags
 *
 * Renders hashtags as clickable pill elements with the format #tagname.
 * Supports click handlers for filter functionality.
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

export interface HashtagPayload {
  tag: string;
  key?: NodeKey;
}

export type SerializedHashtagNode = Spread<
  {
    tag: string;
  },
  SerializedLexicalNode
>;

/**
 * HashtagComponent - React component rendered by the HashtagNode
 */
interface HashtagComponentProps {
  tag: string;
  nodeKey: NodeKey;
  onClick?: (tag: string) => void;
}

function HashtagComponent({ tag, onClick }: HashtagComponentProps): JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(tag);
  };

  return (
    <span
      className="content-pill content-pill--hashtag"
      onClick={handleClick}
      data-hashtag={tag}
      title={`Hashtag: #${tag}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(tag);
        }
      }}
    >
      #{tag}
    </span>
  );
}

/**
 * HashtagNode - Lexical DecoratorNode for hashtags
 */
export class HashtagNode extends DecoratorNode<JSX.Element> {
  __tag: string;

  static getType(): string {
    return 'hashtag';
  }

  static clone(node: HashtagNode): HashtagNode {
    return new HashtagNode(node.__tag, node.__key);
  }

  static importJSON(serializedNode: SerializedHashtagNode): HashtagNode {
    return $createHashtagNode({ tag: serializedNode.tag });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.classList.contains('content-pill--hashtag')) {
          return {
            conversion: (element: HTMLElement) => {
              const tag = element.getAttribute('data-hashtag');
              if (tag) {
                return { node: $createHashtagNode({ tag }) };
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

  constructor(tag: string, key?: NodeKey) {
    super(key);
    this.__tag = tag;
  }

  exportJSON(): SerializedHashtagNode {
    return {
      type: 'hashtag',
      tag: this.__tag,
      version: 1
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.className = 'content-pill content-pill--hashtag';
    element.setAttribute('data-hashtag', this.__tag);
    element.textContent = `#${this.__tag}`;
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'content-pill content-pill--hashtag';
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getTag(): string {
    return this.__tag;
  }

  setTag(tag: string): void {
    const writable = this.getWritable();
    writable.__tag = tag;
  }

  getTextContent(): string {
    return `#${this.__tag}`;
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return true;
  }

  decorate(): JSX.Element {
    return (
      <HashtagComponent
        tag={this.__tag}
        nodeKey={this.__key}
      />
    );
  }
}

/**
 * Create a new HashtagNode
 */
export function $createHashtagNode(payload: HashtagPayload): HashtagNode {
  return new HashtagNode(payload.tag, payload.key);
}

/**
 * Check if a node is a HashtagNode
 */
export function $isHashtagNode(
  node: LexicalNode | null | undefined
): node is HashtagNode {
  return node instanceof HashtagNode;
}

