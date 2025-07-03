# Rich Text Editor with Smart Pill Support

A completely **implementation-agnostic, composable rich text editor** that provides 100% native input behavior with rich content rendering. Features smart pill selection, hashtags, mentions, URLs, emojis, and custom content types.

## 🚀 Quick Start

```tsx
import { RichTextEditor } from '@rich-text-editor';

function MyForm() {
  const [content, setContent] = useState('');
  
  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Type #hashtags and @mentions..."
      multiline={true}
      enableHashtags={true}
      enableUserMentions={true}
      enableEmojis={true}
    />
  );
}
```

## 📦 Available Components & Hooks

### Components

- **`RichTextEditor`** - Form-ready adapter component (recommended)
- **`RichTextInput`** - Core rich input component
- **`RichTextRenderer`** - Default content renderer

### Hooks

- **`useRichTextEditor`** - Simplified state management hook

### Core Classes

- **`RichTextEngine`** - Core state and logic engine
- **`DefaultRenderer`** - Default rendering implementation

## 🎯 Features

### ✅ **100% Native Input Behavior**
- All keyboard shortcuts work (Ctrl+A, Ctrl+Z, arrows, etc.)
- Copy/paste functionality
- Selection behavior identical to native inputs
- Form integration with hidden native input
- Full accessibility support

### ✅ **Smart Pill Selection**
- Clicking on any part of a pill selects the entire pill
- Drag selection automatically expands to pill boundaries
- Keyboard selection (Shift+arrows) respects pill boundaries
- Pills are treated as atomic units

### ✅ **Rich Content Support**
- **Hashtags** - `#tag` → styled pill
- **Mentions** - `@[username|id|author]` → user pill
- **URLs** - Auto-detection with configurable behavior
- **Emojis** - Unicode and custom image emojis
- **Images** - Embedded image support
- **Custom Content** - Pluggable parser system

### ✅ **Advanced Features**
- Multi-line support with full textarea functionality
- History system with undo/redo
- Smart positioning and coordinate calculation
- Performance optimized rendering
- TypeScript support throughout

## 📖 Detailed Usage

### Basic Rich Text Editor

```tsx
import { RichTextEditor } from '@rich-text-editor';

function BasicExample() {
  const [value, setValue] = useState('Hello #world! Check out @[user|123|author]');
  
  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      placeholder="Start typing..."
      multiline={true}
      viewMode="preview" // or "raw"
      enableHashtags={true}
      enableUserMentions={true}
      enableEmojis={true}
      enableImagePaste={true}
      className="my-editor"
      disabled={false}
    />
  );
}
```

### Using the Hook for Advanced Control

```tsx
import { useRichTextEditor, RichTextInput } from '@rich-text-editor';

function AdvancedExample() {
  const editor = useRichTextEditor({
    initialValue: 'Welcome to our #platform!',
    multiline: true,
    parsers: {
      hashtags: true,
      mentions: true,
      urls: true,
      emojis: true
    },
    behavior: {
      smartSelection: true,
      spellCheck: true
    }
  });
  
  return (
    <div>
      <RichTextInput ref={editor.ref} {...editor} />
      
      <div className="editor-controls">
        <button onClick={() => editor.insertText(' #trending')}>
          Add Hashtag
        </button>
        <button onClick={() => editor.clear()}>
          Clear
        </button>
        <button onClick={() => editor.undo()}>
          Undo
        </button>
        <button onClick={() => editor.redo()}>
          Redo
        </button>
      </div>
      
      <div className="editor-info">
        <p>Empty: {editor.isEmpty ? 'Yes' : 'No'}</p>
        <p>Focused: {editor.isFocused ? 'Yes' : 'No'}</p>
        <p>Has Selection: {editor.hasSelection ? 'Yes' : 'No'}</p>
        <p>Selected Text: "{editor.selectedText}"</p>
      </div>
    </div>
  );
}
```

### Core Component with Custom Configuration

```tsx
import { RichTextInput, RichTextConfig } from '@rich-text-editor';

function CoreExample() {
  const [value, setValue] = useState('');
  
  const config: RichTextConfig = {
    multiline: true,
    placeholder: "Enter rich content...",
    parsers: {
      hashtags: true,
      mentions: true,
      urls: true,
      emojis: true,
      images: false,
      markdown: true
    },
    behavior: {
      smartSelection: true,
      autoComplete: false,
      spellCheck: true,
      tabSize: 2
    },
    styling: {
      className: 'custom-rich-input',
      style: {
        minHeight: '100px',
        border: '2px solid #007bff',
        borderRadius: '8px'
      }
    }
  };
  
  return (
    <RichTextInput
      value={value}
      onChange={setValue}
      {...config}
      handlers={{
        onFocus: (state) => console.log('Focused:', state),
        onBlur: (state) => console.log('Blurred:', state),
        onTokenClick: (token, state) => console.log('Token clicked:', token)
      }}
    />
  );
}
```

## 🔧 Custom Parsers

Create custom content types with the parser system:

```tsx
import { createCustomParser, RichTextInput } from '@rich-text-editor';

// Create a phone number parser
const phoneParser = createCustomParser(
  'phone',
  50, // priority
  (text) => {
    const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/g;
    const tokens = [];
    let match;
    
    while ((match = phoneRegex.exec(text)) !== null) {
      tokens.push({
        type: 'custom',
        content: match[0],
        rawText: match[0],
        start: match.index,
        end: match.index + match[0].length,
        metadata: { 
          customType: 'phone',
          phoneNumber: match[0]
        }
      });
    }
    
    return tokens;
  }
);

function CustomParserExample() {
  const [value, setValue] = useState('Call me at 555-123-4567');
  
  return (
    <RichTextInput
      value={value}
      onChange={setValue}
      parsers={{
        hashtags: true,
        mentions: true,
        custom: [phoneParser]
      }}
    />
  );
}
```

## 🎨 Custom Rendering

Customize how content is rendered:

```tsx
import { createCustomRenderer, RichTextInput } from '@rich-text-editor';

const customRenderer = createCustomRenderer(
  // Custom token renderer
  (token, index, state) => {
    if (token.type === 'hashtag') {
      return (
        <span 
          key={index}
          className="custom-hashtag"
          style={{ 
            backgroundColor: '#ff6b35', 
            color: 'white',
            padding: '2px 8px',
            borderRadius: '16px'
          }}
        >
          #{token.content}
        </span>
      );
    }
    
    // Use default renderer for other types
    return null;
  }
);

function CustomRenderExample() {
  return (
    <RichTextInput
      value="Check out #customStyle"
      onChange={() => {}}
      renderer={customRenderer}
    />
  );
}
```

## 🔌 API Reference

### RichTextEditor Props

```tsx
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  contextId: string;
  multiline?: boolean;
  viewMode?: 'preview' | 'raw';
  enableHashtags?: boolean;
  enableUserMentions?: boolean;
  enableEmojis?: boolean;
  enableImagePaste?: boolean;
}
```

### useRichTextEditor Hook

```tsx
interface UseRichTextEditorOptions {
  initialValue?: string;
  multiline?: boolean;
  parsers?: ParserConfig;
  behavior?: BehaviorConfig;
  styling?: StylingConfig;
  onChange?: (value: string) => void;
  onStateChange?: (state: RichTextState) => void;
}

interface UseRichTextEditorReturn {
  value: string;
  state: RichTextState | null;
  ref: React.RefObject<RichTextInputRef>;
  
  // Methods
  setValue: (value: string) => void;
  insertText: (text: string) => void;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  
  // State
  isEmpty: boolean;
  isFocused: boolean;
  hasSelection: boolean;
  selectedText: string;
}
```

### RichTextToken

```tsx
interface RichTextToken {
  type: 'text' | 'hashtag' | 'mention' | 'url' | 'emoji' | 'image' | 'markdown' | 'custom';
  content: string;
  rawText: string;
  start: number;
  end: number;
  metadata?: {
    // Type-specific data
    hashtag?: string;
    userId?: string;
    username?: string;
    href?: string;
    emojiId?: string;
    customType?: string;
    // ... more
  };
}
```

## 🎯 Form Integration

The rich text editor integrates seamlessly with forms:

```tsx
import { RichTextEditor } from '@rich-text-editor';
import { useForm } from 'react-hook-form';

function FormExample() {
  const { register, handleSubmit, setValue, watch } = useForm();
  const content = watch('content', '');
  
  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <label>Post Content</label>
      <RichTextEditor
        value={content}
        onChange={(value) => setValue('content', value)}
        placeholder="Write your post..."
        multiline={true}
        enableHashtags={true}
        enableUserMentions={true}
      />
      
      {/* Hidden input for form submission */}
      <input type="hidden" {...register('content')} />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 🎨 Styling

The editor uses CSS variables for easy theming:

```css
.rich-input {
  --border-color: #e1e5e9;
  --focus-color: #007bff;
  --background-color: #ffffff;
  --cursor-color: #333333;
  --selection-color: rgba(0, 123, 255, 0.25);
  --placeholder-color: #6c757d;
}

.rich-input .content-pill--hashtag {
  --hashtag-bg: rgba(0, 123, 255, 0.1);
  --hashtag-color: #007bff;
  --hashtag-border: rgba(0, 123, 255, 0.3);
}

.rich-input .content-pill--mention {
  --mention-bg: rgba(40, 167, 69, 0.1);
  --mention-color: #28a745;
  --mention-border: rgba(40, 167, 69, 0.3);
}
```

## 🚀 Performance

- **Efficient Parsing** - Only re-parses when text changes
- **Smart Rendering** - Optimized React rendering with proper keys
- **Lazy Loading** - Components load only when needed
- **Memory Management** - Automatic cleanup of event listeners
- **History Limits** - Configurable undo/redo history size

## 🔧 Advanced Configuration

```tsx
import { RichTextInput, RichTextEngine } from '@rich-text-editor';

function AdvancedConfig() {
  const engine = new RichTextEngine({
    multiline: true,
    maxLength: 5000,
    parsers: {
      hashtags: true,
      mentions: true,
      urls: true,
      emojis: true,
      custom: [
        // Custom parsers
      ]
    },
    behavior: {
      smartSelection: true,
      autoComplete: true,
      spellCheck: true,
      tabSize: 4
    }
  });
  
  return (
    <RichTextInput
      engine={engine}
      className="advanced-editor"
    />
  );
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   ```tsx
   // ❌ Wrong
   import { RichTextEditor } from 'rich-text-editor';
   
   // ✅ Correct
   import { RichTextEditor } from '@rich-text-editor';
   ```

2. **State Updates**
   ```tsx
   // ❌ Wrong - will cause infinite loops
   useEffect(() => {
     editor.setValue(externalValue);
   }, [editor]);
   
   // ✅ Correct
   useEffect(() => {
     editor.setValue(externalValue);
   }, [externalValue, editor.setValue]);
   ```

3. **Performance**
   ```tsx
   // ❌ Wrong - recreates config on every render
   const config = { multiline: true };
   
   // ✅ Correct - stable reference
   const config = useMemo(() => ({ multiline: true }), []);
   ```

## 📝 Examples

Check out the `/examples` directory for more detailed examples:

- **Basic Usage** - Simple form integration
- **Advanced Features** - Custom parsers and renderers
- **Theming** - Custom styling examples
- **Performance** - Optimized implementations

## 🤝 Contributing

The rich text editor is designed to be completely modular and extensible. You can:

- Add custom parsers for new content types
- Create custom renderers for different styling
- Extend the engine with new functionality
- Contribute improvements to the core system

## 📄 License

This rich text editor system is part of the idling.app project and follows the same licensing terms. 