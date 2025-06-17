# UI Components & Overlay System

This directory contains reusable UI components and the advanced overlay management system that supports modals, widgets, and other overlay elements.

## Components

### FooterBadge
A semi-hidden expandable badge that "hugs" the footer and expands on mouse proximity.

```tsx
import { FooterBadge } from './FooterBadge';

<FooterBadge
  text="+ Post"
  icon="✏️"
  onClick={handleClick}
  theme="primary"
  rightOffset={20}
  bottomOffset={20}
  hoverDistance={100}
/>
```

**Features:**
- Semi-hidden state by default (50% hidden)
- Expands when mouse gets within `hoverDistance` pixels
- Multiple theme variants (primary, secondary, success, warning, danger)
- Configurable positioning and hover sensitivity
- Smooth animations and accessibility support

### PostModal
A reusable modal component for creating, viewing, and editing posts.

```tsx
import { PostModal } from './PostModal';

<PostModal
  mode="create" // 'create' | 'view' | 'edit'
  onClose={handleClose}
/>
```

### OverlayRenderer
Renders all overlay elements (modals, widgets, popups) using React portals.

**Features:**
- Portal-based rendering for z-index isolation
- Automatic portal container management
- Support for modals, draggable widgets, and popups

## Overlay Management System

### OverlayContext
Global state management for overlays with mutual exclusivity rules.

```tsx
import { OverlayProvider, useOverlay } from '../../../lib/context/OverlayContext';

// Wrap your app
<OverlayProvider>
  <App />
  <OverlayRenderer />
</OverlayProvider>

// Use in components
const { openOverlay, closeOverlay } = useOverlay();
```

**Key Features:**
- **Modal Exclusivity**: Only one modal can be open at a time
- **Widget Management**: Multiple widgets allowed (unless `allowMultiple: false`)
- **Pin/Unpin System**: Convert any element to a draggable widget
- **Z-index Management**: Automatic layering with incremental z-indices

### Opening Overlays

```tsx
// Open a modal
openOverlay({
  id: 'my-modal',
  type: 'modal',
  component: MyComponent,
  props: { data: 'example' }
});

// Open a draggable widget
openOverlay({
  id: 'my-widget',
  type: 'widget',
  component: MyWidget,
  position: { x: 100, y: 100 },
  size: { width: 300, height: 200 },
  isDraggable: true,
  isResizable: true
});
```

### Widget System

Widgets are draggable, resizable overlay elements:

**Features:**
- **Drag & Drop**: Full mouse-based dragging with boundary constraints
- **Resizing**: Bottom-right resize handle with minimum size limits
- **Pin/Unpin**: Convert existing DOM elements to widgets
- **Original Removal**: Optionally hide original element when pinned

**Usage:**
```tsx
const { togglePin } = useOverlay();

// Pin an existing element
const handlePin = (elementId: string) => {
  const element = document.getElementById(elementId);
  togglePin(elementId, element);
};
```

## Hooks

### usePostModal
Convenience hook for opening post-related modals.

```tsx
import { usePostModal } from '../../hooks/usePostModal';

const { openCreateModal, openViewModal, openEditModal } = usePostModal({
  onClose: () => console.log('Modal closed')
});

// Open create modal
openCreateModal();

// Open view modal
openViewModal('post-123', 'Post Title', <PostContent />);

// Open edit modal  
openEditModal('post-123', true);
```

## Implementation Example

### FloatingAddPost
A draggable floating action button for creating posts:

```tsx
export const FloatingAddPost = ({ onPostCreated }) => {
  // Uses session hooks internally for authorization
  // Fully draggable with position persistence
  // Opens inline modal with AddSubmissionForm

  return (
    <div className="floating-add-post">
      {/* Draggable button with warm theme */}
      {/* Modal with clean styling */}
    </div>
  );
};
```

**Features:**
- **Draggable**: Click and drag to reposition anywhere on screen
- **Position Memory**: Remembers position using localStorage
- **Session Integration**: Uses useSession hook for authorization
- **Organic Styling**: Warm color palette with whimsical quill icon
- **Smart Interaction**: Distinguishes between clicks and drags

## Architecture Benefits

1. **Centralized Management**: All overlays managed through single context
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Performance**: Portal-based rendering prevents z-index conflicts
4. **Accessibility**: Proper ARIA attributes and keyboard support
5. **Extensibility**: Easy to add new overlay types and behaviors
6. **Reusability**: Components designed for maximum reuse across the app

## CSS Architecture

Each component has its own CSS file with:
- **Base styles**: Core functionality and layout
- **Theme variants**: Multiple color schemes
- **Responsive design**: Mobile-first approach
- **Dark mode**: Automatic system preference detection
- **Accessibility**: High contrast and reduced motion support
- **Animations**: Smooth transitions with performance optimization

## Portal Management

The overlay system automatically:
- Creates portal containers when needed
- Cleans up containers when all overlays close
- Manages event listeners and cleanup
- Handles body scroll locking for modals
- Provides backdrop click and escape key handling

## SmartInput

The `SmartInput` component provides intelligent hashtag and user mention suggestions as users type. It can be used anywhere in the application where you want to enable #hashtag and @user suggestions.

### Basic Usage

```tsx
import { SmartInput } from '../ui/SmartInput';

function MyComponent() {
  const [value, setValue] = useState('');

  return (
    <SmartInput
      value={value}
      onChange={setValue}
      placeholder="Type # for hashtags or @ for mentions..."
      as="textarea"  // or "input"
      rows={4}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current input value |
| `onChange` | `(value: string) => void` | - | Called when value changes |
| `placeholder` | `string` | - | Input placeholder text |
| `className` | `string` | `''` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether input is disabled |
| `as` | `'input' \| 'textarea'` | `'input'` | Type of input element |
| `rows` | `number` | `3` | Number of rows (textarea only) |
| `enableHashtags` | `boolean` | `true` | Enable hashtag suggestions |
| `enableUserMentions` | `boolean` | `true` | Enable user mention suggestions |
| `maxSuggestions` | `number` | `5` | Max suggestions to show |
| `minQueryLength` | `number` | `2` | Min characters before searching |

### Features

- **Hashtag Suggestions**: Type `#` followed by text to see hashtag suggestions based on existing posts
- **User Mentions**: Type `@` followed by text to see user suggestions based on post authors
- **Keyboard Navigation**: Use arrow keys to navigate, Enter/Tab to select, Escape to close
- **Click to Select**: Click on any suggestion to insert it
- **Smart Replacement**: Automatically handles duplicate `#` or `@` characters in suggestions
- **Responsive**: Works on mobile and desktop

### Advanced Usage

```tsx
// Only enable hashtags
<SmartInput
  value={tags}
  onChange={setTags}
  enableHashtags={true}
  enableUserMentions={false}
  placeholder="#tag1, #tag2, #tag3"
/>

// Custom styling
<SmartInput
  value={content}
  onChange={setContent}
  className="my-custom-input-class"
  as="textarea"
  rows={6}
  maxSuggestions={10}
/>
```

### CSS Classes

The component uses these CSS classes for styling:

- `.inline-suggestion-container` - Main container
- `.inline-suggestion-input` - Input/textarea element
- `.suggestion-list` - Dropdown list
- `.suggestion-item` - Individual suggestion
- `.suggestion-item.selected` - Selected suggestion
- `.suggestion-trigger` - The # or @ character
- `.suggestion-label` - Suggestion text
- `.suggestion-avatar` - User avatar (for mentions)

### Examples in the App

The SmartInput is currently used in:

1. **Reply Forms** - For titles, content, and tags
2. **Thread Discussions** - Pre-filled with @mentions when replying
3. **Post Creation** - Can be added to any form field

### Low-Level Component

If you need more control, you can use the underlying `InlineSuggestionInput` component directly and provide your own search functions:

```tsx
import { InlineSuggestionInput } from '../ui/InlineSuggestionInput';

<InlineSuggestionInput
  value={value}
  onChange={setValue}
  onHashtagSearch={myCustomHashtagSearch}
  onUserSearch={myCustomUserSearch}
/>
``` 