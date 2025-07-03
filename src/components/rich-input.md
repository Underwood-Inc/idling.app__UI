---
layout: default
title: RichInput Component System
description: Comprehensive rich text input with smart pill support and native behavior
---

# RichInput Component System

The RichInput component system provides a sophisticated text input experience with support for rich content like hashtags, mentions, URLs, emojis, and custom content types while maintaining native input behavior.

## Overview

Located in `src/lib/rich-input/`, this system consists of:

- **RichInput Component**: Main React component with full input simulation
- **RichInputEngine**: Core engine handling state, parsing, and operations
- **Rendering System**: Flexible renderer for different content types
- **Utilities**: Position calculation, token handling, and cursor management

## Key Features

- 🎯 **Native Input Behavior**: Feels like a standard input/textarea
- 🏷️ **Smart Pills**: Hashtags, mentions, URLs rendered as interactive pills
- 🎨 **Custom Renderers**: Flexible rendering system for different content types
- ⌨️ **Keyboard Navigation**: Full keyboard support with smart cursor positioning
- 🔄 **Undo/Redo**: Complete history management
- 📱 **Mobile Friendly**: Touch and gesture support
- ♿ **Accessible**: Full ARIA support and screen reader compatibility

## Basic Usage

```tsx
import { RichInput } from '@/lib/rich-input';

function MyComponent() {
  const [value, setValue] = useState('');

  return (
    <RichInput
      value={value}
      onChange={setValue}
      placeholder="Type something..."
      multiline={true}
    />
  );
}
```

## Advanced Configuration

```tsx
import { RichInput, createComponentLogger } from '@/lib/rich-input';

const logger = createComponentLogger('MyRichInput');

function AdvancedRichInput() {
  const [value, setValue] = useState('');

  const handleStateChange = (state) => {
    logger.debug('State changed:', state);
  };

  return (
    <RichInput
      value={value}
      onChange={setValue}
      onStateChange={handleStateChange}
      config={{
        maxLength: 500,
        enableHistory: true,
        enableSmartCursor: true
      }}
      handlers={{
        onEnter: (event) => {
          // Custom enter handling
          console.log('Enter pressed');
        },
        onEscape: (event) => {
          // Custom escape handling
          console.log('Escape pressed');
        }
      }}
      enableDebugLogging={true}
    />
  );
}
```

## Content Types

The system automatically detects and renders various content types:

### Hashtags

- **Pattern**: `#hashtag`
- **Rendering**: Styled pill with click handling
- **Navigation**: Arrow keys move between hashtags

### Mentions

- **Pattern**: `@username`
- **Rendering**: User avatar + name pill
- **Integration**: Links to user profiles

### URLs

- **Pattern**: `https://example.com`
- **Rendering**: Link preview pills
- **Behavior**: Click to open in new tab

### Emojis

- **Pattern**: `:emoji_name:` or Unicode
- **Rendering**: Native emoji or custom images
- **Picker**: Integrated emoji picker support

## API Reference

### RichInput Props

```tsx
interface RichInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onStateChange?: (state: RichInputState) => void;
  handlers?: RichInputEventHandlers;
  renderer?: RichInputRenderer;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  config?: Partial<RichInputConfig>;
}
```

### RichInput Methods (via ref)

```tsx
const richInputRef = useRef<RichInputAPI>(null);

// Text operations
richInputRef.current?.insertText('Hello', position);
richInputRef.current?.deleteText(range);
richInputRef.current?.replaceText(range, 'New text');

// Selection operations
richInputRef.current?.setSelection(selection);
richInputRef.current?.selectAll();
richInputRef.current?.selectToken(token);

// Cursor operations
richInputRef.current?.setCursor(position);
richInputRef.current?.moveCursor('right', extend);

// History operations
richInputRef.current?.undo();
richInputRef.current?.redo();

// Utility operations
richInputRef.current?.focus();
richInputRef.current?.blur();
richInputRef.current?.clear();
```

## Custom Renderers

Create custom renderers for specialized content:

```tsx
import { RichContentRenderer } from '@/lib/rich-input';

const customRenderer: RichContentRenderer = {
  renderToken: (token, isSelected, handlers) => {
    if (token.type === 'custom') {
      return (
        <span
          className="custom-token"
          onClick={() => handlers.onTokenClick?.(token)}
        >
          {token.content}
        </span>
      );
    }
    return null; // Fall back to default renderer
  },

  renderPlaceholder: (placeholder) => (
    <span className="custom-placeholder">{placeholder}</span>
  )
};

function CustomRichInput() {
  return (
    <RichInput
      renderer={customRenderer}
      // ... other props
    />
  );
}
```

## Performance Considerations

- **Batched Updates**: State changes are batched for performance
- **Virtual Scrolling**: Large content automatically virtualized
- **Debounced Parsing**: Content parsing is debounced during typing
- **Memoized Rendering**: Tokens are memoized to prevent unnecessary re-renders

## Testing

The component includes comprehensive test utilities:

```tsx
import { RichInput } from '@/lib/rich-input';
import { render, fireEvent } from '@testing-library/react';

test('handles text input correctly', () => {
  const handleChange = jest.fn();
  const { getByRole } = render(<RichInput onChange={handleChange} />);

  const input = getByRole('textbox');
  fireEvent.change(input, { target: { value: 'Hello #world' } });

  expect(handleChange).toHaveBeenCalledWith('Hello #world');
});
```

## Accessibility

The component provides full accessibility support:

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling
- **Screen Reader**: Announces content changes
- **High Contrast**: Supports high contrast themes

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallback**: Graceful degradation to standard textarea

## Migration Guide

### From Standard Input

```tsx
// Before
<input
  value={value}
  onChange={e => setValue(e.target.value)}
  placeholder="Type something..."
/>

// After
<RichInput
  value={value}
  onChange={setValue}
  placeholder="Type something..."
/>
```

### From Textarea

```tsx
// Before
<textarea
  value={value}
  onChange={e => setValue(e.target.value)}
  rows={4}
/>

// After
<RichInput
  value={value}
  onChange={setValue}
  multiline={true}
  config={{ minRows: 4 }}
/>
```

## Related Components

- **RichTextEditor**: Higher-level editor with toolbar
- **MentionPicker**: Autocomplete for mentions
- **EmojiPicker**: Emoji selection interface
- **HashtagSuggester**: Hashtag autocomplete system
