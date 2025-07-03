---
layout: default
title: Scroll Highlight Utilities
description: Visual highlighting system for scroll restoration and user feedback
---

# Scroll Highlight Utilities

The scroll highlight utilities provide a sophisticated system for visually highlighting elements after scroll restoration or for user feedback. Located in `src/lib/utils/scroll-highlight.ts`, this system offers smooth animations with customizable colors, intensities, and behaviors.

## Overview

The scroll highlight system consists of:

- **Core Animation Engine**: CSS-based animations with JavaScript control
- **Preset Configurations**: Pre-defined styles for common use cases
- **Smart Detection**: Automatic element detection and highlighting
- **Performance Optimized**: Hardware-accelerated animations with minimal DOM manipulation

## Key Features

- 🎨 **Customizable Animations**: Multiple colors, intensities, and speeds
- 🔄 **Smooth Transitions**: Hardware-accelerated CSS animations
- 📱 **Mobile Optimized**: Touch-friendly animations with proper timing
- ♿ **Accessibility Aware**: Respects user motion preferences
- 🎯 **Smart Targeting**: Automatic element detection and boundary snapping
- 🚀 **Performance First**: Minimal DOM manipulation and efficient cleanup

## Basic Usage

```tsx
import { applyScrollHighlight } from '@/lib/utils/scroll-highlight';

function MyComponent() {
  const handleHighlight = () => {
    const element = document.getElementById('target-element');
    if (element) {
      applyScrollHighlight(element);
    }
  };

  return (
    <div>
      <div id="target-element">Content to highlight</div>
      <button onClick={handleHighlight}>Highlight Element</button>
    </div>
  );
}
```

## Advanced Configuration

```tsx
import {
  applyScrollHighlight,
  HIGHLIGHT_PRESETS,
  type ScrollHighlightOptions
} from '@/lib/utils/scroll-highlight';

function AdvancedHighlight() {
  const handleCustomHighlight = () => {
    const element = document.querySelector('.my-element');
    if (element) {
      applyScrollHighlight(element, {
        duration: 2000,
        intensity: 'intense',
        color: 'success',
        speed: 'slow',
        enablePulse: true,
        enableScale: true,
        offset: 10
      });
    }
  };

  const handlePresetHighlight = () => {
    const element = document.querySelector('.preset-element');
    if (element) {
      applyScrollHighlight(element, HIGHLIGHT_PRESETS.SUCCESS_FAST);
    }
  };

  return (
    <div>
      <div className="my-element">Custom highlight target</div>
      <div className="preset-element">Preset highlight target</div>
      <button onClick={handleCustomHighlight}>Custom Highlight</button>
      <button onClick={handlePresetHighlight}>Preset Highlight</button>
    </div>
  );
}
```

## Configuration Options

### ScrollHighlightOptions

```tsx
interface ScrollHighlightOptions {
  duration?: number; // Animation duration in milliseconds
  offset?: number; // Offset from element edges
  className?: string; // Custom CSS class name
  intensity?: 'subtle' | 'normal' | 'intense';
  color?: 'default' | 'success' | 'warning' | 'error';
  speed?: 'instant' | 'fast' | 'normal' | 'slow';
  enablePulse?: boolean; // Enable pulsing animation
  enableScale?: boolean; // Enable scaling animation
}
```

### Preset Configurations

```tsx
import { HIGHLIGHT_PRESETS } from '@/lib/utils/scroll-highlight';

// Available presets
HIGHLIGHT_PRESETS.DEFAULT; // Standard highlight
HIGHLIGHT_PRESETS.SUCCESS; // Success feedback
HIGHLIGHT_PRESETS.SUCCESS_FAST; // Quick success feedback
HIGHLIGHT_PRESETS.WARNING; // Warning highlight
HIGHLIGHT_PRESETS.ERROR; // Error highlight
HIGHLIGHT_PRESETS.SUBTLE; // Minimal highlight
HIGHLIGHT_PRESETS.INTENSE; // Maximum visibility
```

## Animation Types

### Box Shadow Highlight

The primary animation method using CSS box-shadow:

```css
.scroll-restore-highlight {
  box-shadow: 0 0 0 4px rgba(var(--highlight-color-rgb), 0.3);
  transition: box-shadow var(--highlight-duration) ease-out;
}
```

### Pulse Animation

Optional pulsing effect for enhanced visibility:

```css
.scroll-restore-highlight--pulse {
  animation: scroll-highlight-pulse var(--highlight-duration) ease-out;
}

@keyframes scroll-highlight-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(var(--highlight-color-rgb), 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(var(--highlight-color-rgb), 0.4);
  }
}
```

### Scale Animation

Optional scaling effect for dynamic feedback:

```css
.scroll-restore-highlight--scale {
  animation: scroll-highlight-scale var(--highlight-duration) ease-out;
}

@keyframes scroll-highlight-scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(var(--highlight-scale-max, 1.02));
  }
  100% {
    transform: scale(1);
  }
}
```

## Color System

### CSS Custom Properties

The system uses CSS custom properties for theming:

```css
:root {
  --scroll-highlight-default: #007bff;
  --scroll-highlight-default-rgb: 0, 123, 255;
  --scroll-highlight-success: #28a745;
  --scroll-highlight-success-rgb: 40, 167, 69;
  --scroll-highlight-warning: #ffc107;
  --scroll-highlight-warning-rgb: 255, 193, 7;
  --scroll-highlight-error: #dc3545;
  --scroll-highlight-error-rgb: 220, 53, 69;
}
```

### Dynamic Color Application

Colors are applied dynamically based on configuration:

```tsx
function applyHighlightColor(element: HTMLElement, color: string) {
  const colorMap = {
    default: 'var(--scroll-highlight-default-rgb)',
    success: 'var(--scroll-highlight-success-rgb)',
    warning: 'var(--scroll-highlight-warning-rgb)',
    error: 'var(--scroll-highlight-error-rgb)'
  };

  element.style.setProperty('--highlight-color-rgb', colorMap[color]);
}
```

## Performance Considerations

### Hardware Acceleration

All animations use hardware-accelerated CSS properties:

```css
.scroll-restore-highlight {
  will-change: box-shadow, transform;
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### Efficient Cleanup

Automatic cleanup prevents memory leaks:

```tsx
function cleanupHighlight(element: HTMLElement, duration: number) {
  setTimeout(() => {
    element.classList.remove('scroll-restore-highlight');
    element.style.removeProperty('--highlight-duration');
    element.style.removeProperty('--highlight-color-rgb');
    element.style.removeProperty('will-change');
  }, duration + 100);
}
```

### Debounced Application

Multiple highlights on the same element are debounced:

```tsx
const highlightTimers = new WeakMap<HTMLElement, number>();

function applyScrollHighlight(
  element: HTMLElement,
  options: ScrollHighlightOptions
) {
  // Clear existing timer
  const existingTimer = highlightTimers.get(element);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Apply new highlight
  // ... highlight logic

  // Set cleanup timer
  const timer = setTimeout(() => cleanup(element), duration);
  highlightTimers.set(element, timer);
}
```

## Accessibility

### Motion Preferences

Respects user motion preferences:

```tsx
function shouldUseAnimation(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return !mediaQuery.matches;
}
```

### Screen Reader Support

Provides appropriate ARIA announcements:

```tsx
function announceHighlight(element: HTMLElement, type: string) {
  const announcement = `${type} highlight applied to ${element.tagName.toLowerCase()}`;

  // Create temporary announcement element
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = announcement;

  document.body.appendChild(announcer);
  setTimeout(() => document.body.removeChild(announcer), 1000);
}
```

## Integration Examples

### Scroll Restoration

Highlight elements after scroll restoration:

```tsx
import { applyScrollHighlight } from '@/lib/utils/scroll-highlight';

function useScrollRestoration() {
  const highlightRestoredElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Scroll to element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight after scroll
      setTimeout(() => {
        applyScrollHighlight(element, {
          color: 'default',
          intensity: 'normal',
          duration: 1500
        });
      }, 500);
    }
  };

  return { highlightRestoredElement };
}
```

### Form Validation

Highlight form fields with validation errors:

```tsx
function FormField({ error, children }) {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && fieldRef.current) {
      applyScrollHighlight(fieldRef.current, {
        color: 'error',
        intensity: 'subtle',
        duration: 1000,
        enablePulse: true
      });
    }
  }, [error]);

  return (
    <div ref={fieldRef} className={error ? 'field-error' : ''}>
      {children}
    </div>
  );
}
```

### Success Feedback

Highlight successful actions:

```tsx
function SuccessButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSuccess = () => {
    if (buttonRef.current) {
      applyScrollHighlight(buttonRef.current, {
        color: 'success',
        intensity: 'normal',
        duration: 1200,
        enableScale: true
      });
    }
  };

  return (
    <button ref={buttonRef} onClick={handleSuccess}>
      Save Changes
    </button>
  );
}
```

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **CSS Features**: CSS Custom Properties, CSS Animations, box-shadow
- **JavaScript Features**: ES2020+, WeakMap, setTimeout/clearTimeout
- **Fallback**: Graceful degradation with no animation

## Testing

### Unit Tests

```tsx
import { applyScrollHighlight } from '@/lib/utils/scroll-highlight';

describe('ScrollHighlight', () => {
  test('applies highlight class to element', () => {
    const element = document.createElement('div');
    applyScrollHighlight(element);

    expect(element.classList.contains('scroll-restore-highlight')).toBe(true);
  });

  test('respects custom duration', () => {
    const element = document.createElement('div');
    applyScrollHighlight(element, { duration: 2000 });

    expect(element.style.getPropertyValue('--highlight-duration')).toBe(
      '2000ms'
    );
  });
});
```

### Integration Tests

```tsx
test('highlights element after scroll restoration', async () => {
  const { getByTestId } = render(<MyComponent />);
  const element = getByTestId('highlight-target');

  // Trigger scroll restoration
  fireEvent.click(getByTestId('restore-button'));

  // Wait for highlight to apply
  await waitFor(() => {
    expect(element).toHaveClass('scroll-restore-highlight');
  });
});
```

## Related Utilities

- **Scroll Position**: Scroll position management and restoration
- **Smooth Scrolling**: Enhanced scrolling with easing functions
- **Viewport Detection**: Element visibility and intersection detection
- **Animation Utils**: General animation utilities and helpers
