# 📋 Component Documentation Template

Use this template when documenting React components for the Idling.app project.

## 📝 Template Instructions

1. **Copy this template** to your component documentation location
2. **Replace placeholders** with your specific information
3. **Delete this instruction section** before publishing
4. **Follow the structure** provided below

---

# [ComponentName]

Brief description of the component and its purpose.

## 🎯 Overview

### Purpose

Explain what this component does and why it exists.

### Key Features

- **Feature 1**: Description of the first key feature
- **Feature 2**: Description of the second key feature
- **Feature 3**: Description of the third key feature

## 📦 Installation

```bash
# If it's a standalone component
npm install @idling/component-name

# Or import from the component library
import { ComponentName } from '@/components/ComponentName';
```

## 🔧 Props Interface

```typescript
interface ComponentNameProps {
  // Required props
  id: string;
  title: string;

  // Optional props
  description?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;

  // Event handlers
  onClick?: (event: MouseEvent) => void;
  onSubmit?: (data: FormData) => void;

  // Children and styling
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
```

### Prop Descriptions

| Prop          | Type                                   | Default     | Description                                       |
| ------------- | -------------------------------------- | ----------- | ------------------------------------------------- |
| `id`          | `string`                               | -           | **Required.** Unique identifier for the component |
| `title`       | `string`                               | -           | **Required.** Display title for the component     |
| `description` | `string`                               | `undefined` | Optional description text                         |
| `variant`     | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual variant of the component                   |
| `size`        | `'small' \| 'medium' \| 'large'`       | `'medium'`  | Size variant of the component                     |
| `disabled`    | `boolean`                              | `false`     | Whether the component is disabled                 |
| `onClick`     | `(event: MouseEvent) => void`          | `undefined` | Click event handler                               |
| `onSubmit`    | `(data: FormData) => void`             | `undefined` | Submit event handler                              |
| `children`    | `React.ReactNode`                      | `undefined` | Child components or content                       |
| `className`   | `string`                               | `undefined` | Additional CSS classes                            |
| `style`       | `React.CSSProperties`                  | `undefined` | Inline styles                                     |

## 🚀 Usage Examples

### Basic Usage

```tsx
import { ComponentName } from '@/components/ComponentName';

function MyPage() {
  return (
    <ComponentName
      id="example-component"
      title="Example Component"
      description="This is an example component"
    />
  );
}
```

### With Event Handlers

```tsx
import { ComponentName } from '@/components/ComponentName';

function InteractiveExample() {
  const handleClick = (event: MouseEvent) => {
    console.log('Component clicked!', event);
  };

  const handleSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
  };

  return (
    <ComponentName
      id="interactive-component"
      title="Interactive Component"
      variant="primary"
      size="large"
      onClick={handleClick}
      onSubmit={handleSubmit}
    />
  );
}
```

### With Children

```tsx
import { ComponentName } from '@/components/ComponentName';

function WithChildren() {
  return (
    <ComponentName id="container-component" title="Container Component">
      <p>This is child content</p>
      <button>Child Button</button>
    </ComponentName>
  );
}
```

### All Variants

```tsx
import { ComponentName } from '@/components/ComponentName';

function AllVariants() {
  return (
    <div>
      <ComponentName
        id="primary-component"
        title="Primary Variant"
        variant="primary"
      />

      <ComponentName
        id="secondary-component"
        title="Secondary Variant"
        variant="secondary"
      />

      <ComponentName
        id="danger-component"
        title="Danger Variant"
        variant="danger"
      />
    </div>
  );
}
```

## 🎨 Styling Guidelines

### CSS Classes

The component uses the following CSS classes:

```css
/* Base component styles */
.component-name {
  /* Base styles */
}

/* Variant styles */
.component-name--primary {
  /* Primary variant styles */
}

.component-name--secondary {
  /* Secondary variant styles */
}

.component-name--danger {
  /* Danger variant styles */
}

/* Size styles */
.component-name--small {
  /* Small size styles */
}

.component-name--medium {
  /* Medium size styles */
}

.component-name--large {
  /* Large size styles */
}

/* State styles */
.component-name--disabled {
  /* Disabled state styles */
}

.component-name--loading {
  /* Loading state styles */
}
```

### Custom Styling

You can customize the component using CSS custom properties:

```css
.component-name {
  --component-background: #f0f0f0;
  --component-text-color: #333;
  --component-border-color: #ccc;
  --component-border-radius: 4px;
  --component-padding: 1rem;
}
```

### Theme Integration

The component integrates with the design system:

```tsx
import { ComponentName } from '@/components/ComponentName';
import { useTheme } from '@/hooks/useTheme';

function ThemedComponent() {
  const theme = useTheme();

  return (
    <ComponentName
      id="themed-component"
      title="Themed Component"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text
      }}
    />
  );
}
```

## ♿ Accessibility

### ARIA Attributes

The component implements proper ARIA attributes:

```tsx
<ComponentName
  id="accessible-component"
  title="Accessible Component"
  aria-label="Component description"
  aria-describedby="component-help-text"
  role="button"
  tabIndex={0}
/>
```

### Keyboard Navigation

- **Tab**: Navigate to the component
- **Enter/Space**: Activate the component (if interactive)
- **Escape**: Close or cancel (if applicable)

### Screen Reader Support

The component provides proper announcements:

```tsx
<ComponentName
  id="announced-component"
  title="Announced Component"
  aria-live="polite"
  aria-atomic="true"
/>
```

### Color Contrast

All variants meet WCAG 2.1 AA standards:

- **Primary**: 4.5:1 contrast ratio
- **Secondary**: 4.5:1 contrast ratio
- **Danger**: 4.5:1 contrast ratio

## 🧪 Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  test('renders with required props', () => {
    render(
      <ComponentName
        id="test-component"
        title="Test Component"
      />
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();

    render(
      <ComponentName
        id="test-component"
        title="Test Component"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('Test Component'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    render(
      <ComponentName
        id="test-component"
        title="Test Component"
        className="custom-class"
      />
    );

    expect(screen.getByText('Test Component')).toHaveClass('custom-class');
  });
});
```

### Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';
import { ThemeProvider } from '@/contexts/ThemeContext';

describe('ComponentName Integration', () => {
  test('integrates with theme provider', () => {
    render(
      <ThemeProvider>
        <ComponentName
          id="themed-component"
          title="Themed Component"
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Themed Component')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('ComponentName E2E', async ({ page }) => {
  await page.goto('/components/component-name');

  // Test component rendering
  await expect(page.locator('[data-testid="component-name"]')).toBeVisible();

  // Test interaction
  await page.click('[data-testid="component-name"]');
  await expect(page.locator('[data-testid="result"]')).toContainText('Clicked');
});
```

## 📊 Performance

### Bundle Size

- **Minified**: ~5KB
- **Gzipped**: ~2KB

### Rendering Performance

- **Initial Render**: <16ms
- **Re-render**: <8ms
- **Memory Usage**: <1MB

### Optimization Tips

```tsx
// Use React.memo for expensive components
const ComponentName = React.memo(({ id, title, ...props }) => {
  // Component implementation
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(props);
}, [props.dependency]);

// Use useCallback for event handlers
const handleClick = useCallback(
  (event) => {
    // Handle click
  },
  [dependency]
);
```

## 🔧 Implementation Details

### File Structure

```
src/components/ComponentName/
├── index.ts                 # Export file
├── ComponentName.tsx        # Main component
├── ComponentName.test.tsx   # Unit tests
├── ComponentName.stories.tsx # Storybook stories
├── ComponentName.module.css # Component styles
└── types.ts                # TypeScript types
```

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.0.0"
  }
}
```

## 📚 Related Components

- **[RelatedComponent1](../RelatedComponent1/)** - Description of relationship
- **[RelatedComponent2](../RelatedComponent2/)** - Description of relationship
- **[ParentComponent](../ParentComponent/)** - Parent component that uses this

## 🔗 References

- **[Design System](../../dev/components/library/)** - Component library guidelines
- **[Testing Guide](../../dev/testing/)** - Testing best practices
- **[Accessibility Guide](../../community/standards/design/)** - Accessibility standards
- **[API Documentation](../../docs/api/)** - Related API endpoints

## 📝 Changelog

### Version 1.2.0

- Added new `variant` prop
- Improved accessibility support
- Performance optimizations

### Version 1.1.0

- Added `size` prop
- Enhanced TypeScript types
- Bug fixes

### Version 1.0.0

- Initial release
- Basic functionality
- Unit tests

---

**Last Updated**: January 28, 2025
**Author**: [Your Name]
**Reviewers**: [Reviewer Names]
