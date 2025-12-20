/**
 * MentionNode - Custom Lexical node for user mentions
 *
 * Supports the structured format: @[username|userId|filterType]
 * Renders as a clickable pill with just @username displayed.
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

import type { MentionData } from '../types';

export interface MentionPayload extends MentionData {
  key?: NodeKey;
}

export type SerializedMentionNode = Spread<
  MentionData,
  SerializedLexicalNode
>;

/**
 * MentionComponent - React component rendered by the MentionNode
 */
interface MentionComponentProps {
  data: MentionData;
  nodeKey: NodeKey;
  onClick?: (data: MentionData) => void;
}

function MentionComponent({ data, onClick }: MentionComponentProps): JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(data);
  };

  return (
    <span
      className="content-pill content-pill--mention"
      onClick={handleClick}
      data-user-id={data.userId}
      data-filter-type={data.filterType}
      title={`Mention: @${data.displayName}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(data);
        }
      }}
    >
      @{data.displayName}
    </span>
  );
}

/**
 * MentionNode - Lexical DecoratorNode for mentions
 */
export class MentionNode extends DecoratorNode<JSX.Element> {
  __displayName: string;
  __userId: string;
  __filterType: 'author' | 'mentions';

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__displayName,
      node.__userId,
      node.__filterType,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode({
      displayName: serializedNode.displayName,
      userId: serializedNode.userId,
      filterType: serializedNode.filterType
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.classList.contains('content-pill--mention')) {
          return {
            conversion: (element: HTMLElement) => {
              const userId = element.getAttribute('data-user-id');
              const filterType = element.getAttribute('data-filter-type') as 'author' | 'mentions';
              const textContent = element.textContent || '';
              const displayName = textContent.startsWith('@')
                ? textContent.slice(1)
                : textContent;

              if (userId && displayName) {
                return {
                  node: $createMentionNode({
                    displayName,
                    userId,
                    filterType: filterType || 'author'
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
    displayName: string,
    userId: string,
    filterType: 'author' | 'mentions',
    key?: NodeKey
  ) {
    super(key);
    this.__displayName = displayName;
    this.__userId = userId;
    this.__filterType = filterType;
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      displayName: this.__displayName,
      userId: this.__userId,
      filterType: this.__filterType,
      version: 1
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.className = 'content-pill content-pill--mention';
    element.setAttribute('data-user-id', this.__userId);
    element.setAttribute('data-filter-type', this.__filterType);
    element.textContent = `@${this.__displayName}`;
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'content-pill content-pill--mention';
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getData(): MentionData {
    return {
      displayName: this.__displayName,
      userId: this.__userId,
      filterType: this.__filterType
    };
  }

  getDisplayName(): string {
    return this.__displayName;
  }

  getUserId(): string {
    return this.__userId;
  }

  getFilterType(): 'author' | 'mentions' {
    return this.__filterType;
  }

  setData(data: MentionData): void {
    const writable = this.getWritable();
    writable.__displayName = data.displayName;
    writable.__userId = data.userId;
    writable.__filterType = data.filterType;
  }

  /**
   * Get the raw text format for serialization
   * Format: @[displayName|userId|filterType]
   */
  getTextContent(): string {
    return `@[${this.__displayName}|${this.__userId}|${this.__filterType}]`;
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return true;
  }

  decorate(): JSX.Element {
    return (
      <MentionComponent
        data={this.getData()}
        nodeKey={this.__key}
      />
    );
  }
}

/**
 * Create a new MentionNode
 */
export function $createMentionNode(payload: MentionPayload): MentionNode {
  return new MentionNode(
    payload.displayName,
    payload.userId,
    payload.filterType,
    payload.key
  );
}

/**
 * Check if a node is a MentionNode
 */
export function $isMentionNode(
  node: LexicalNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode;
}

