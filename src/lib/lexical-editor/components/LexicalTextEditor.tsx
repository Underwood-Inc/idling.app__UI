/**
 * LexicalTextEditor - Clean, standalone Lexical editor component
 * 
 * A simple, reliable rich text editor using Lexical.
 * Custom features like hashtags, mentions, emojis will be added as
 * proper Lexical plugins in the future.
 */

'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  EditorState,
  LexicalEditor
} from 'lexical';

import '../theme/LexicalEditor.css';
import { lexicalTheme } from '../theme/lexicalTheme';

export interface LexicalTextEditorProps {
  /** Current value */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS class */
  className?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether to allow multiple lines */
  multiline?: boolean;
  /** Max character length */
  maxLength?: number;
  /** Called when editor gains focus */
  onFocus?: () => void;
  /** Called when editor loses focus */
  onBlur?: () => void;
}

export interface LexicalTextEditorRef {
  focus: () => void;
  blur: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  clear: () => void;
  insertText: (text: string) => void;
  getEditor: () => LexicalEditor | null;
}

/**
 * Placeholder component
 */
function Placeholder({ text }: { text: string }): JSX.Element {
  return <div className="lexical-placeholder">{text}</div>;
}

/**
 * Editor state sync component
 */
interface EditorSyncProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  editorRef: React.MutableRefObject<LexicalTextEditorRef | null>;
}

function EditorSync({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  editorRef
}: EditorSyncProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const isInternalChange = useRef(false);
  const lastExternalValue = useRef(value);

  // Expose editor methods via ref
  useImperativeHandle(
    editorRef,
    () => ({
      focus: () => editor.focus(),
      blur: () => editor.blur(),
      getValue: () => {
        let text = '';
        editor.getEditorState().read(() => {
          text = $getRoot().getTextContent();
        });
        return text;
      },
      setValue: (newValue: string) => {
        isInternalChange.current = true;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          if (newValue) {
            const lines = newValue.split('\n');
            lines.forEach((line) => {
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode(line));
              root.append(paragraph);
            });
          } else {
            root.append($createParagraphNode());
          }
        });
        isInternalChange.current = false;
      },
      clear: () => {
        isInternalChange.current = true;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
        isInternalChange.current = false;
      },
      insertText: (text: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(text);
          }
        });
      },
      getEditor: () => editor
    }),
    [editor]
  );

  // Sync external value changes to editor (only when value differs from what we have)
  useEffect(() => {
    if (value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      
      // Check if editor content matches
      let currentText = '';
      editor.getEditorState().read(() => {
        currentText = $getRoot().getTextContent();
      });

      // Only update if the content is actually different
      if (currentText !== value) {
        isInternalChange.current = true;
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
        isInternalChange.current = false;
      }
    }
  }, [editor, value]);

  // Handle editable state
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // Handle focus/blur events
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleFocus = () => onFocus?.();
    const handleBlur = () => onBlur?.();

    rootElement.addEventListener('focus', handleFocus);
    rootElement.addEventListener('blur', handleBlur);

    return () => {
      rootElement.removeEventListener('focus', handleFocus);
      rootElement.removeEventListener('blur', handleBlur);
    };
  }, [editor, onFocus, onBlur]);

  // Handle onChange
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (isInternalChange.current) return;

      editorState.read(() => {
        const text = $getRoot().getTextContent();
        if (text !== lastExternalValue.current) {
          lastExternalValue.current = text;
          onChange(text);
        }
      });
    },
    [onChange]
  );

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />;
}

/**
 * Main LexicalTextEditor component
 */
export const LexicalTextEditor = forwardRef<
  LexicalTextEditorRef,
  LexicalTextEditorProps
>(
  (
    {
      value,
      onChange,
      placeholder = 'Write something...',
      className = '',
      disabled = false,
      multiline = true,
      maxLength,
      onFocus,
      onBlur
    },
    ref
  ) => {
    const editorRef = useRef<LexicalTextEditorRef | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Forward ref
    useImperativeHandle(ref, () => editorRef.current as LexicalTextEditorRef);

    // Initial config
    const initialConfig = {
      namespace: 'LexicalTextEditor',
      theme: lexicalTheme,
      nodes: [
        HeadingNode,
        QuoteNode,
        LinkNode,
        AutoLinkNode,
        ListNode,
        ListItemNode
      ],
      onError: (error: Error) => {
        console.error('Lexical Editor Error:', error);
      },
      editable: !disabled
    };

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onFocus?.();
    }, [onFocus]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);

    const editorClassName = [
      'lexical-text-editor',
      multiline ? 'lexical-text-editor--multiline' : 'lexical-text-editor--single-line',
      disabled ? 'lexical-text-editor--disabled' : '',
      isFocused ? 'lexical-text-editor--focused' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={editorClassName}>
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="lexical-text-editor__input"
                aria-placeholder={placeholder}
                aria-disabled={disabled}
                placeholder={<Placeholder text={placeholder} />}
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
          <EditorSync
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            editorRef={editorRef}
          />
        </LexicalComposer>
      </div>
    );
  }
);

LexicalTextEditor.displayName = 'LexicalTextEditor';

export default LexicalTextEditor;

