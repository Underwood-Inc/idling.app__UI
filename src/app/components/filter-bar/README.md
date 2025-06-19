# Custom Filter Input Component

The `CustomFilterInput` component provides a powerful, agnostic filter input control that supports both user and tag filtering with smart search capabilities and intelligent auto-detection.

## Features

### 🎯 **Smart Auto-Detection**
- **Automatic mode switching**: No manual toggles needed - just start typing!
- **Hashtag detection**: Type `#` and get instant hashtag suggestions
- **User detection**: Type `@` and get instant user suggestions  
- **Visual feedback**: Real-time mode indicators show current filter type
- **Fallback handling**: Plain text automatically treated as hashtags

### 🏷️ Tag Filtering
- **Smart hashtag suggestions** powered by existing hashtag search
- **Auto-detection** when typing `#` characters
- **Validation** ensures proper hashtag format
- **Integration** with existing tag filter logic (AND/OR)

### 👥 User Filtering  
- **Dual modes**: Author filters (posts by user) and Mention filters (posts mentioning user)
- **Smart user suggestions** with avatars and usernames
- **Structured format support**: Handles `@[username|userId]` format from SmartInput
- **Fallback handling**: Simple `@username` format support
- **Integration** with existing user filter logic (AND/OR)

### 🎨 **Simplified UX**
- **One input field**: Single SmartInput handles all filter types
- **Context-aware help**: Dynamic help text based on current input
- **Minimal UI**: No clutter - just the essentials
- **Responsive design**: Mobile-friendly interface

## Usage

### Basic Implementation

```tsx
import { CustomFilterInput } from '../filter-bar/CustomFilterInput';
import { useSubmissionsManager } from '../../../lib/state/useSubmissionsManager';

function MyComponent() {
  const { addFilter } = useSubmissionsManager({
    contextId: 'my-context'
  });

  return (
    <CustomFilterInput
      contextId="my-context"
      onAddFilter={addFilter}
    />
  );
}
```

### Integration with PostsManager

The component is already integrated into `PostsManager` and works seamlessly with the existing filter system:

```tsx
// In PostsManager.tsx
<CustomFilterInput
  contextId={contextId}
  onAddFilter={addFilter}
  className="posts-manager__custom-filter"
/>
```

### Props Interface

```tsx
interface CustomFilterInputProps {
  contextId: string;                              // Context ID for filter management
  onAddFilter: (filter: Filter<PostFilters>) => void; // Filter addition callback
  placeholder?: string;                           // Custom placeholder text
  className?: string;                            // Additional CSS classes
}
```

## How It Works

### 🎯 **Smart Detection Flow**

1. **Start typing** in the single input field
2. **Auto-detection** determines filter type:
   - `#javascript` → **Hashtag mode** with tag suggestions
   - `@username` → **User mode** with user suggestions
   - `react` → **Fallback** to hashtag mode
3. **Visual feedback** shows current mode with colored badges
4. **Context help** updates dynamically
5. **Submit** and filter is automatically applied

### 🎨 **UI States**

#### Empty State
```
┌─────────────────────────────────────────────┐
│ Add filter: @user or #tag...                │
│                                        [Add]│
└─────────────────────────────────────────────┘
  Type # for hashtags or @ for users...
```

#### Hashtag Mode
```
┌─────────────────────────────────────────────┐
│ #javascript                     [#Tag] [Add]│
└─────────────────────────────────────────────┘
  Filtering by hashtag - select from suggestions or type custom tag
```

#### User Mode (Author)
```
┌─────────────────────────────────────────────┐
│ @johndoe                   [@Author]   [Add]│
│ [Posts by user           ▼]                 │
└─────────────────────────────────────────────┘
  Filtering posts by user - select from suggestions
```

#### User Mode (Mentions)
```
┌─────────────────────────────────────────────┐
│ @johndoe                [@Mentions]    [Add]│
│ [Posts mentioning user ▼]                   │
└─────────────────────────────────────────────┘
  Filtering posts mentioning user - select from suggestions
```

## Filter Types & Modes

### Tag Filters
- **Input format**: `#javascript`, `#react`, `#webdev`
- **Auto-completion**: Suggests existing hashtags from posts
- **Output**: `{ name: 'tags', value: '#javascript' }`

### User Filters

#### Author Mode (Default)
- **Purpose**: Filter posts written BY a specific user
- **Input format**: `@username` or `@[username|userId]`
- **Output**: `{ name: 'author', value: 'userId' }`

#### Mentions Mode  
- **Purpose**: Filter posts that MENTION a specific user
- **Input format**: `@username` or `@[username|userId]`
- **Output**: `{ name: 'mentions', value: 'username' }`

## Integration with Existing Filter System

The component fully integrates with the existing filter management system:

### Filter Logic Support
- **Tag Logic**: Existing `tagLogic` (AND/OR) controls multiple tag filters
- **User Logic**: Existing `authorLogic` and `mentionsLogic` (AND/OR) controls
- **Global Logic**: Existing `globalLogic` (AND/OR) controls between filter groups

### Filter Management
- **Add**: Uses existing `addFilter()` method from `useSubmissionsManager`
- **Remove**: Works with existing `removeFilter()` and `removeTag()` methods
- **Display**: Integrates with existing `FilterBar` component
- **URL Sync**: Automatically syncs with URL parameters

## User Experience

### Simplified Workflow
1. **Start typing** in the input field
2. **Watch auto-detection** switch modes automatically
3. **Choose user mode** (Author/Mentions) if typing @
4. **Select suggestion** or continue typing
5. **Submit** using Add button or Enter key
6. **View filter** in FilterBar above
7. **Manage filters** using existing FilterBar controls

### Visual Feedback
- **Mode badges**: Color-coded indicators show current filter type
  - `#Tag` - Orange badge for hashtag mode
  - `@Author` - Blue badge for author filtering  
  - `@Mentions` - Orange badge for mention filtering
- **Dynamic help**: Context-aware help text updates as you type
- **Smooth animations**: Mode indicators slide in/out gracefully

## Styling & Theming

### CSS Classes
- `.custom-filter-input` - Main container
- `.custom-filter-input__input` - Smart input field
- `.custom-filter-input__mode-badge` - Mode indicator badges
- `.custom-filter-input__submit` - Submit button
- `.custom-filter-input__help` - Help text area

### Mode Badge Colors
- **Hashtag**: Orange theme matching brand primary
- **Author**: Blue theme for author identification
- **Mentions**: Orange theme for mention highlighting

### Responsive Design
- **Desktop**: Horizontal layout with inline mode selector
- **Tablet**: Stacked layout for better space usage  
- **Mobile**: Full-width vertical layout

### Dark Mode
- Automatically adapts to system dark mode preferences
- Mode badges maintain contrast and readability

## Testing

Comprehensive test coverage includes:
- ✅ Component rendering and basic functionality
- ✅ Auto-detection of hashtag vs user modes  
- ✅ Mode indicator display and hiding
- ✅ User mode switching (Author ↔ Mentions)  
- ✅ Input processing and filter creation
- ✅ Structured mention format handling
- ✅ Plain text fallback to hashtag mode
- ✅ Dynamic help text updates
- ✅ Input clearing after submission
- ✅ Mode selector visibility logic

## Examples

### Smart Detection in Action
```
User types: "#"          → Auto-switches to hashtag mode
User types: "#react"     → Shows hashtag suggestions for "react"
User types: "@"          → Auto-switches to user mode (author)
User types: "@john"      → Shows user suggestions for "john"
User types: "javascript" → Will be treated as "#javascript" when submitted
```

### Mode Switching
```
User types: "@john"               → Author mode (default)
User selects: "Posts mentioning user" → Switches to mentions mode
Badge changes: "@Author" → "@Mentions"
Help text updates to match new mode
```

### Structured Format Handling
```
SmartInput suggestion: "@[johndoe|user123]"
Author mode output:    { name: 'author', value: 'user123' }
Mentions mode output:  { name: 'mentions', value: 'johndoe' }
```

## Architecture Benefits

### Simplified UX
- **Single input**: No cognitive load from multiple controls
- **Smart detection**: Technology handles the complexity
- **Visual feedback**: Users always know current state
- **Minimal clicks**: Fewer interactions needed

### Performance
- **Smart caching**: Leverages existing search result caching
- **Debounced input**: Prevents excessive API calls during typing
- **Optimized rendering**: Minimal re-renders on state changes
- **Intelligent suggestions**: Only searches when appropriate

### Accessibility
- **Keyboard navigation**: Full keyboard support including Enter to submit
- **Screen readers**: Proper ARIA labels and live region updates
- **Focus management**: Logical tab order and focus indicators
- **Color contrast**: Mode badges meet WCAG guidelines

This simplified component provides an intuitive, powerful way to add filters while maintaining full compatibility with the existing filter management system. The smart detection eliminates UI complexity while the visual feedback keeps users informed about their current context. 