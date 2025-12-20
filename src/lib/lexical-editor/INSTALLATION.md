# Lexical Rich Text Editor Installation Guide

This document provides instructions for installing and setting up the Lexical-based rich text editor.

## Prerequisites

- Node.js >= 20.x
- pnpm package manager

## Required Packages

Install the following Lexical packages:

```bash
pnpm add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/markdown @lexical/history @lexical/selection @lexical/utils @lexical/html
```

### Package Breakdown

| Package | Purpose |
|---------|---------|
| `lexical` | Core Lexical framework |
| `@lexical/react` | React bindings and components |
| `@lexical/rich-text` | Rich text formatting support |
| `@lexical/list` | Ordered and unordered lists |
| `@lexical/link` | Link and auto-link nodes |
| `@lexical/code` | Code blocks and syntax highlighting |
| `@lexical/markdown` | Markdown shortcuts and transformers |
| `@lexical/history` | Undo/redo functionality |
| `@lexical/selection` | Selection utilities |
| `@lexical/utils` | General utilities |
| `@lexical/html` | HTML import/export |

## React Version Compatibility

Lexical requires React 18+. This project uses React 19 RC, which should be compatible.

## Usage

### Basic Example

```tsx
import { LexicalRichEditor } from '@lib/lexical-editor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <LexicalRichEditor
      value={content}
      onChange={setContent}
      placeholder="Write something..."
      multiline={true}
      enableHashtags={true}
      enableMentions={true}
      enableEmojis={true}
      enableUrls={true}
    />
  );
}
```

### With Ref

```tsx
import { LexicalRichEditor, LexicalRichEditorRef } from '@lib/lexical-editor';

function MyComponent() {
  const editorRef = useRef<LexicalRichEditorRef>(null);

  const handleInsert = () => {
    editorRef.current?.insertText('Hello!');
  };

  return (
    <>
      <LexicalRichEditor
        ref={editorRef}
        value=""
        onChange={console.log}
      />
      <button onClick={handleInsert}>Insert</button>
    </>
  );
}
```

## Features

### Hashtags
- Type `#` followed by text to create a hashtag
- Renders as clickable pill
- Click handler for filter integration

### Mentions
- Structured format: `@[username|userId|filterType]`
- Displays as `@username` pill
- Supports author and mentions filter types

### URL Pills
- Structured format: `![behavior](url)` or `![behavior|width](url)`
- Behavior options: `embed`, `link`, `modal`
- Width options: `small`, `medium`, `large`, `full`
- Edit mode controls for behavior and width

### Emojis
- Shortcode format: `:emoji_name:`
- Supports Unicode and custom image emojis
- Database integration via `/api/emojis` endpoint

### Markdown
- Bold: `**text**`
- Italic: `*text*`
- Code: `` `code` ``
- Links: `[text](url)`
- Lists: `- item` or `1. item`

## Migration from RichInput

The new Lexical editor is designed to be a drop-in replacement for the existing `RichInput` component. The main differences are:

1. **Import path**: `@lib/lexical-editor` instead of `@lib/rich-input`
2. **Component name**: `LexicalRichEditor` instead of `RichInput`
3. **Ref API**: Slightly different method names (see ref methods above)

The raw text format for storage remains compatible with the existing system.

## Troubleshooting

### "Module not found" errors

Ensure all Lexical packages are installed:

```bash
pnpm add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/markdown @lexical/history @lexical/selection @lexical/utils @lexical/html
```

### React version conflicts

If you encounter React version conflicts, add resolutions to `package.json`:

```json
{
  "resolutions": {
    "react": "^19.0.0-rc-e56f4ae3-20240830",
    "react-dom": "^19.0.0-rc-e56f4ae3-20240830"
  }
}
```

### Styling issues

Ensure the CSS is imported. The component automatically imports `LexicalEditor.css`, but you may need to adjust CSS variables to match your theme.

