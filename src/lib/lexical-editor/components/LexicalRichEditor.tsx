/**
 * LexicalRichEditor - Main React component for the Lexical rich text editor
 *
 * A comprehensive rich text editor that supports:
 * - Hashtags with search and filtering
 * - Structured mentions (@[username|userId|filterType])
 * - URL pills with behavior controls (embed/link/modal)
 * - Custom emoji support with database integration
 * - Markdown formatting
 * - Multiline editing with proper cursor handling
 *
 * @example
 * ```tsx
 * <LexicalRichEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Write something..."
 *   multiline={true}
 *   enableHashtags={true}
 *   enableMentions={true}
 *   enableEmojis={true}
 * />
 * ```
 */

'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';

// Lexical core imports - these will be available after installing lexical
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { TRANSFORMERS } from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  EditorState,
  LexicalEditor
} from 'lexical';

// Custom nodes
import { EmojiNode } from '../nodes/EmojiNode';
import { HashtagNode } from '../nodes/HashtagNode';
import { MentionNode } from '../nodes/MentionNode';
import { URLPillNode } from '../nodes/URLPillNode';

// Theme
import '../theme/LexicalEditor.css';
import { lexicalTheme } from '../theme/lexicalTheme';

// Types
import type { LexicalEditorConfig, LexicalEditorEventHandlers } from '../types';

// Serialization utilities

export interface LexicalRichEditorProps
  extends LexicalEditorConfig,
    LexicalEditorEventHandlers {
  /** Initial value in raw text format */
  value?: string;
  /** CSS class name for the editor container */
  className?: string;
  /** Unique context ID for the editor */
  contextId?: string;
  /** View mode: 'preview' for rich rendering, 'raw' for plain text */
  viewMode?: 'preview' | 'raw';
}

export interface LexicalRichEditorRef {
  /** Focus the editor */
  focus: () => void;
  /** Blur the editor */
  blur: () => void;
  /** Get the current raw text value */
  getValue: () => string;
  /** Set the editor value */
  setValue: (value: string) => void;
  /** Clear the editor */
  clear: () => void;
  /** Insert text at the current cursor position */
  insertText: (text: string) => void;
  /** Get the Lexical editor instance */
  getEditor: () => LexicalEditor | null;
}

/**
 * Placeholder component
 */
function Placeholder({
  text,
  multiline
}: {
  text: string;
  multiline?: boolean;
}): JSX.Element {
  return (
    <div
      className="lexical-placeholder"
      style={{
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap'
      }}
    >
      {text}
    </div>
  );
}

/**
 * Inner editor component that has access to the Lexical context
 */
interface InnerEditorProps {
  value?: string;
  onChange?: (rawText: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  multiline?: boolean;
  disabled?: boolean;
  editorRef: React.MutableRefObject<LexicalRichEditorRef | null>;
}

function InnerEditor({
  value,
  onChange,
  onFocus,
  onBlur,
  multiline,
  disabled,
  editorRef
}: InnerEditorProps): null {
  const [editor] = useLexicalComposerContext();
  const isInitialMount = useRef(true);
  const lastValueRef = useRef(value);

  // Expose editor methods via ref
  useImperativeHandle(
    editorRef,
    () => ({
      focus: () => {
        editor.focus();
      },
      blur: () => {
        editor.blur();
      },
      getValue: () => {
        let rawText = '';
        editor.getEditorState().read(() => {
          const root = $getRoot();
          rawText = root.getTextContent();
        });
        return rawText;
      },
      setValue: (newValue: string) => {
        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(newValue));
          root.append(paragraph);
        });
      },
      clear: () => {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
      },
      insertText: (text: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (selection) {
            selection.insertText(text);
          }
        });
      },
      getEditor: () => editor
    }),
    [editor]
  );

  // Sync external value changes to editor
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // Set initial value
      if (value) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();

          // Parse the raw text and create nodes
          const lines = value.split('\n');
          lines.forEach((line, index) => {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(line));
            root.append(paragraph);
          });
        });
      }
      return;
    }

    // Only update if value changed externally
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (value) {
          const lines = value.split('\n');
          lines.forEach((line) => {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(line));
            root.append(paragraph);
          });
        } else {
          root.append($createParagraphNode());
        }
      });
    }
  }, [editor, value]);

  // Register focus/blur handlers
  useEffect(() => {
    return editor.registerRootListener(
      (
        rootElement: HTMLElement | null,
        prevRootElement: HTMLElement | null
      ) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('focus', () => onFocus?.());
          prevRootElement.removeEventListener('blur', () => onBlur?.());
        }

        if (rootElement) {
          rootElement.addEventListener('focus', () => onFocus?.());
          rootElement.addEventListener('blur', () => onBlur?.());
        }
      }
    );
  }, [editor, onFocus, onBlur]);

  // Handle editable state
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return null;
}

/**
 * OnChange handler component
 */
interface OnChangeHandlerProps {
  onChange?: (rawText: string) => void;
  lastValueRef: React.MutableRefObject<string | undefined>;
}

function OnChangeHandler({
  onChange,
  lastValueRef
}: OnChangeHandlerProps): JSX.Element {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const root = $getRoot();
        const rawText = root.getTextContent();

        // Only call onChange if value actually changed
        if (rawText !== lastValueRef.current) {
          lastValueRef.current = rawText;
          onChange?.(rawText);
        }
      });
    },
    [onChange, lastValueRef]
  );

  return <OnChangePlugin onChange={handleChange} />;
}

/**
 * Main LexicalRichEditor component
 */
export const LexicalRichEditor = forwardRef<
  LexicalRichEditorRef,
  LexicalRichEditorProps
>(
  (
    {
      value = '',
      onChange,
      onFocus,
      onBlur,
      onHashtagClick,
      onMentionClick,
      onURLClick,
      placeholder = 'Write something...',
      className = '',
      contextId = '',
      viewMode = 'preview',
      multiline = false,
      disabled = false,
      maxLength,
      enableHashtags = true,
      enableMentions = true,
      enableEmojis = true,
      enableUrls = true,
      enableMarkdown = true,
      enableImagePaste = true,
      mentionFilterType = 'author'
    },
    ref
  ) => {
    const editorRef = useRef<LexicalRichEditorRef | null>(null);
    const lastValueRef = useRef<string | undefined>(value);

    // Forward ref
    useImperativeHandle(ref, () => editorRef.current as LexicalRichEditorRef);

    // Build list of nodes to register
    const nodes = [
      // Built-in rich text nodes
      HeadingNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      ListNode,
      ListItemNode,
      HorizontalRuleNode,
      // Custom nodes
      ...(enableHashtags ? [HashtagNode] : []),
      ...(enableMentions ? [MentionNode] : []),
      ...(enableEmojis ? [EmojiNode] : []),
      ...(enableUrls ? [URLPillNode] : [])
    ];

    // Initial config
    const initialConfig = {
      namespace: contextId || 'LexicalRichEditor',
      theme: lexicalTheme,
      nodes,
      onError: (error: Error) => {
        console.error('Lexical Editor Error:', error);
      },
      editable: !disabled
    };

    // Raw mode - render plain textarea
    if (viewMode === 'raw') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`lexical-editor lexical-editor--raw ${multiline ? 'lexical-editor--multiline' : 'lexical-editor--single-line'} ${disabled ? 'lexical-editor--disabled' : ''} ${className}`}
          disabled={disabled}
          onFocus={onFocus}
          onBlur={onBlur}
          maxLength={maxLength}
          rows={multiline ? 4 : 1}
          style={{
            resize: multiline ? 'vertical' : 'none'
          }}
        />
      );
    }

    // Preview mode - render Lexical editor
    return (
      <div
        className={`lexical-editor-container ${className}`}
        data-context-id={contextId}
      >
        <LexicalComposer initialConfig={initialConfig}>
          {/* Core plugins */}
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`lexical-content-editable ${multiline ? 'lexical-editor--multiline' : 'lexical-editor--single-line'} ${disabled ? 'lexical-editor--disabled' : ''}`}
                aria-placeholder={placeholder}
                aria-multiline={multiline}
                aria-disabled={disabled}
                placeholder={
                  <Placeholder text={placeholder} multiline={multiline} />
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />

          {/* History (undo/redo) */}
          <HistoryPlugin />

          {/* Links */}
          <LinkPlugin />

          {/* Lists */}
          <ListPlugin />

          {/* Tab indentation */}
          <TabIndentationPlugin />

          {/* Markdown shortcuts */}
          {enableMarkdown && (
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          )}

          {/* OnChange handler */}
          <OnChangeHandler onChange={onChange} lastValueRef={lastValueRef} />

          {/* Inner editor with ref exposure */}
          <InnerEditor
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            multiline={multiline}
            disabled={disabled}
            editorRef={
              editorRef as React.MutableRefObject<LexicalRichEditorRef | null>
            }
          />

          {/* TODO: Add custom plugins for hashtags, mentions, emojis, URLs */}
        </LexicalComposer>
      </div>
    );
  }
);

LexicalRichEditor.displayName = 'LexicalRichEditor';

export default LexicalRichEditor;
