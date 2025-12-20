/**
 * URLPillNode - Custom Lexical node for URL pills
 *
 * Supports the structured format: ![behavior|width](url) or ![behavior](url)
 * Provides behavior controls (embed/link/modal) and width controls.
 */

'use client';

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread
} from 'lexical';

import { DecoratorNode, $getNodeByKey } from 'lexical';
import React, { useCallback } from 'react';

import type { URLPillData, URLBehavior, URLWidth } from '../types';

export interface URLPillPayload extends URLPillData {
  key?: NodeKey;
}

export type SerializedURLPillNode = Spread<
  URLPillData,
  SerializedLexicalNode
>;

/**
 * URLPillComponent - React component rendered by the URLPillNode
 */
interface URLPillComponentProps {
  data: URLPillData;
  nodeKey: NodeKey;
  isEditMode?: boolean;
  editor: LexicalEditor;
  onClick?: (url: string) => void;
}

function URLPillComponent({
  data,
  nodeKey,
  isEditMode = true,
  editor,
  onClick
}: URLPillComponentProps): JSX.Element {
  const { url, behavior, width } = data;

  // Extract domain for display
  let domain = url;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    // Keep original URL if parsing fails
  }

  // Determine if this is a YouTube URL
  const isYouTube = domain.includes('youtube') || domain.includes('youtu.be');
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff|tif)$/i.test(url);

  // Handle behavior change
  const handleBehaviorChange = useCallback((newBehavior: URLBehavior) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isURLPillNode(node)) {
        node.setBehavior(newBehavior);
      }
    });
  }, [editor, nodeKey]);

  // Handle width change
  const handleWidthChange = useCallback((newWidth: URLWidth) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isURLPillNode(node)) {
        node.setWidth(newWidth);
      }
    });
  }, [editor, nodeKey]);

  // Handle remove
  const handleRemove = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) {
      e.preventDefault();
      onClick?.(url);
    }
  };

  // Get icon based on content type
  const getIcon = () => {
    if (isYouTube) return '📺';
    if (isImage) return '🖼️';
    return '🔗';
  };

  // Get behavior icon
  const getBehaviorIcon = () => {
    switch (behavior) {
      case 'embed': return '📺';
      case 'modal': return '⧉';
      case 'link':
      default: return '↗';
    }
  };

  return (
    <span
      className={`url-pill url-pill--${behavior}`}
      data-url={url}
      data-behavior={behavior}
      data-width={width}
    >
      <a
        href={behavior === 'modal' ? '#' : url}
        target={behavior === 'modal' ? undefined : '_blank'}
        rel={behavior === 'modal' ? undefined : 'noopener noreferrer'}
        className="url-pill__link"
        onClick={handleClick}
      >
        <span className="url-pill__icon">{getIcon()}</span>
        <span className="url-pill__domain">{domain}</span>
        <span className="url-pill__behavior-icon">{getBehaviorIcon()}</span>
      </a>

      {isEditMode && (
        <span className="url-pill__controls">
          {/* Behavior toggles */}
          <span className="url-pill__behavior-toggles">
            <button
              type="button"
              className={`url-pill__toggle ${behavior === 'embed' ? 'url-pill__toggle--active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBehaviorChange('embed');
              }}
              onMouseDown={(e) => e.preventDefault()}
              title="Embed"
              aria-label="Show as embed"
            >
              📺
            </button>
            <button
              type="button"
              className={`url-pill__toggle ${behavior === 'link' ? 'url-pill__toggle--active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBehaviorChange('link');
              }}
              onMouseDown={(e) => e.preventDefault()}
              title="Link"
              aria-label="Show as link"
            >
              🔗
            </button>
            {isYouTube && (
              <button
                type="button"
                className={`url-pill__toggle ${behavior === 'modal' ? 'url-pill__toggle--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBehaviorChange('modal');
                }}
                onMouseDown={(e) => e.preventDefault()}
                title="Modal"
                aria-label="Show in modal"
              >
                ⧉
              </button>
            )}
          </span>

          {/* Width controls - only for embed behavior */}
          {behavior === 'embed' && (
            <span className="url-pill__width-controls">
              <button
                type="button"
                className={`url-pill__toggle ${width === 'small' ? 'url-pill__toggle--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWidthChange('small');
                }}
                onMouseDown={(e) => e.preventDefault()}
                title="Small"
                aria-label="Small size"
              >
                📱
              </button>
              <button
                type="button"
                className={`url-pill__toggle ${width === 'medium' ? 'url-pill__toggle--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWidthChange('medium');
                }}
                onMouseDown={(e) => e.preventDefault()}
                title="Medium"
                aria-label="Medium size"
              >
                💻
              </button>
              <button
                type="button"
                className={`url-pill__toggle ${width === 'large' ? 'url-pill__toggle--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWidthChange('large');
                }}
                onMouseDown={(e) => e.preventDefault()}
                title="Large"
                aria-label="Large size"
              >
                🖥️
              </button>
              <button
                type="button"
                className={`url-pill__toggle ${width === 'full' ? 'url-pill__toggle--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWidthChange('full');
                }}
                onMouseDown={(e) => e.preventDefault()}
                title="Full width"
                aria-label="Full width"
              >
                📺
              </button>
            </span>
          )}

          {/* Remove button */}
          <button
            type="button"
            className="url-pill__toggle url-pill__toggle--remove"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove();
            }}
            onMouseDown={(e) => e.preventDefault()}
            title="Remove"
            aria-label="Remove URL"
          >
            ✕
          </button>
        </span>
      )}
    </span>
  );
}

/**
 * URLPillNode - Lexical DecoratorNode for URL pills
 */
export class URLPillNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __behavior: URLBehavior;
  __width: URLWidth;

  static getType(): string {
    return 'url-pill';
  }

  static clone(node: URLPillNode): URLPillNode {
    return new URLPillNode(
      node.__url,
      node.__behavior,
      node.__width,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedURLPillNode): URLPillNode {
    return $createURLPillNode({
      url: serializedNode.url,
      behavior: serializedNode.behavior,
      width: serializedNode.width
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.classList.contains('url-pill')) {
          return {
            conversion: (element: HTMLElement) => {
              const url = element.getAttribute('data-url');
              const behavior = element.getAttribute('data-behavior') as URLBehavior;
              const width = element.getAttribute('data-width') as URLWidth;

              if (url) {
                return {
                  node: $createURLPillNode({
                    url,
                    behavior: behavior || 'link',
                    width: width || 'medium'
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
    url: string,
    behavior: URLBehavior,
    width: URLWidth,
    key?: NodeKey
  ) {
    super(key);
    this.__url = url;
    this.__behavior = behavior;
    this.__width = width;
  }

  exportJSON(): SerializedURLPillNode {
    return {
      type: 'url-pill',
      url: this.__url,
      behavior: this.__behavior,
      width: this.__width,
      version: 1
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.className = `url-pill url-pill--${this.__behavior}`;
    element.setAttribute('data-url', this.__url);
    element.setAttribute('data-behavior', this.__behavior);
    element.setAttribute('data-width', this.__width);

    const link = document.createElement('a');
    link.href = this.__url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = this.__url;

    element.appendChild(link);
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = `url-pill url-pill--${this.__behavior}`;
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getData(): URLPillData {
    return {
      url: this.__url,
      behavior: this.__behavior,
      width: this.__width
    };
  }

  getUrl(): string {
    return this.__url;
  }

  getBehavior(): URLBehavior {
    return this.__behavior;
  }

  getWidth(): URLWidth {
    return this.__width;
  }

  setUrl(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  setBehavior(behavior: URLBehavior): void {
    const writable = this.getWritable();
    writable.__behavior = behavior;
  }

  setWidth(width: URLWidth): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  /**
   * Get the raw text format for serialization
   * Format: ![behavior|width](url) or ![behavior](url)
   */
  getTextContent(): string {
    if (this.__width && this.__width !== 'medium') {
      return `![${this.__behavior}|${this.__width}](${this.__url})`;
    }
    return `![${this.__behavior}](${this.__url})`;
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return true;
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <URLPillComponent
        data={this.getData()}
        nodeKey={this.__key}
        editor={editor}
        isEditMode={true}
      />
    );
  }
}

/**
 * Create a new URLPillNode
 */
export function $createURLPillNode(payload: URLPillPayload): URLPillNode {
  return new URLPillNode(
    payload.url,
    payload.behavior,
    payload.width,
    payload.key
  );
}

/**
 * Check if a node is a URLPillNode
 */
export function $isURLPillNode(
  node: LexicalNode | null | undefined
): node is URLPillNode {
  return node instanceof URLPillNode;
}

