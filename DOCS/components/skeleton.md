# Intelligent Skeleton Loading System

This directory contains the intelligent skeleton loading system that creates accurate skeleton representations of your actual DOM structure.

## How It Works

The `IntelligentSkeletonWrapper` component:

1. **Captures DOM Structure**: When content loads, it analyzes the actual DOM structure of your components
2. **Identifies Content Elements**: Uses intelligent detection to find text, images, buttons, and other content elements
3. **Reconstructs Layout**: Creates skeleton versions that preserve the exact layout structure
4. **Matches Count**: Uses pre-request data to render the exact number of skeleton items expected

## Key Features

### 🎯 **Accurate DOM Reconstruction**
- Preserves exact layout structure (flexbox, grid, positioning)
- Maintains element hierarchy and nesting
- Copies CSS properties for accurate sizing and spacing

### 🔍 **Intelligent Content Detection**
- Automatically identifies text elements, buttons, images, links
- Recognizes submission-specific classes (`submission__title`, `author__name`, etc.)
- Detects interactive elements and media content

### 📊 **Smart Skeleton Generation**
- Different skeleton styles for different content types:
  - **Text**: Animated gradient with natural width variations
  - **Buttons**: Darker gradient with proper button styling
  - **Images**: Circular or rectangular based on aspect ratio
  - **Links**: Brand-colored gradients
  - **Inputs**: Border styling with input-specific appearance

### 🎨 **Responsive & Accessible**
- Dark mode support with appropriate color schemes
- High contrast mode compatibility
- Reduced motion support for accessibility
- Mobile-responsive adjustments

## Usage

### Basic Usage

```tsx
import { IntelligentSkeletonWrapper } from './skeleton/IntelligentSkeletonWrapper';

<IntelligentSkeletonWrapper
  isLoading={isLoading}
  expectedItemCount={expectedCount}
  className="my-skeleton-wrapper"
>
  <MyContentComponent />
</IntelligentSkeletonWrapper>
```

### Advanced Usage with Pre-request Data

```tsx
// Get expected count from pre-request
const { data: preRequestData } = usePaginationPreRequest({
  filters,
  pageSize,
  enabled: true
});

const expectedSkeletonItems = preRequestData?.expectedItems || 5;

<IntelligentSkeletonWrapper
  isLoading={isLoading}
  expectedItemCount={expectedSkeletonItems}
  onStructureCaptured={(structure) => {
    console.log('Captured structure:', structure);
  }}
  fallbackSkeleton={<CustomFallback />}
>
  <SubmissionsList />
</IntelligentSkeletonWrapper>
```

## Component Structure

### IntelligentSkeletonWrapper
Main wrapper component that handles:
- DOM structure capture and analysis
- Skeleton generation and rendering
- Loading state management
- Fallback handling

### Element Analysis
The system analyzes each DOM element for:
- **Type**: text, button, image, container, etc.
- **Styles**: All computed CSS properties
- **Content**: Text content and attributes
- **Children**: Recursive analysis of child elements
- **Skeleton Target**: Whether element should be replaced with skeleton

### Skeleton Generation
Creates appropriate skeleton elements:
- Preserves original element positioning and sizing
- Applies skeleton-specific styling (gradients, animations)
- Maintains accessibility attributes
- Uses semantic HTML elements where appropriate

## Integration with PostsManager

The system is integrated into the posts page:

```tsx
// In PostsManager.tsx
<IntelligentSkeletonWrapper
  isLoading={isLoading}
  expectedItemCount={expectedSkeletonItems}
  className="posts-manager__submissions-wrapper"
>
  <SubmissionsList />
</IntelligentSkeletonWrapper>
```

This creates skeleton versions of:
- Submission items (`submission__wrapper`)
- Author information (`author__name`, `author__bio`)
- Post titles and content (`submission__title`, `submission__description`)
- Action buttons (`submission__reply-btn`, `submission__edit-btn`)
- Tags and metadata (`tag-link`, `submission__datetime`)

## Performance Considerations

- **Capture Timing**: Structure is captured after content loads with a 150ms delay
- **Caching**: Captured structures are cached to avoid re-analysis
- **Virtual Scrolling**: Compatible with virtual scrolling implementations
- **Memory Management**: Cleans up observers and cached data appropriately

## Customization

### Custom Skeleton Styles
Add custom CSS classes:

```css
.skeleton-element--custom {
  background: linear-gradient(90deg, #custom1, #custom2);
  border-radius: 8px;
}
```

### Custom Content Detection
Extend the `isSkeletonTarget` function to detect your specific elements:

```tsx
const contentClasses = [
  'my-custom-text',
  'my-custom-button',
  // ... existing classes
];
```

## Browser Support

- Modern browsers with ResizeObserver support
- Graceful fallback for older browsers
- Progressive enhancement approach

## Accessibility

- Maintains ARIA attributes and roles
- Respects `prefers-reduced-motion`
- Supports high contrast modes
- Preserves semantic HTML structure

## Development

### Debugging
Enable development mode to see:
- Structure capture logs
- Skeleton target identification
- Performance metrics
- DOM analysis details

### Testing
The system includes:
- Unit tests for element analysis
- Integration tests with actual components
- Visual regression tests for skeleton accuracy 