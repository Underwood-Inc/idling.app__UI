---
layout: default
title: 'Component Library'
description: 'Complete component documentation and design system'
permalink: /dev/components/library/
---

# 📚 Component Library

Complete documentation for all Idling.app UI components, design patterns, and implementation guidelines.

## 🎯 Design Philosophy

Our components follow these core principles:

- **🌙 Dark-Mode First** - Designed primarily for dark themes with elegant light mode support
- **♿ Accessibility** - WCAG 2.1 AA compliant with full keyboard navigation
- **📱 Responsive** - Mobile-first design that scales beautifully to desktop
- **⚡ Performance** - Optimized for speed with minimal bundle impact
- **🧩 Composable** - Modular design for flexible composition

## 📝 Input & Editing Components

### Rich Input System

**Location**: `/src/components/RichInput/`

A sophisticated text editing component that transforms basic text input into an intelligent, interactive writing experience.

**Key Features**:

- Hashtag detection and enhancement
- User mention system with search
- URL auto-conversion with rich previews
- Emoji support with picker
- Image paste functionality
- Floating toolbar for quick access
- Smart search overlays

**Usage Example**:

```jsx
import { RichInput } from '@/components/RichInput';

<RichInput
  placeholder="What's on your mind?"
  onSubmit={handleSubmit}
  enableHashtags={true}
  enableMentions={true}
  enableEmojis={true}
/>;
```

### Filter Bar

**Location**: `/src/components/FilterBar/`

Advanced filtering interface with smart inputs and real-time search capabilities.

**Key Features**:

- Smart filter suggestions
- Real-time search with debouncing
- Filter pill management
- Keyboard shortcuts
- Customizable filter types

**Usage Example**:

```jsx
import { FilterBar } from '@/components/FilterBar';

<FilterBar
  filters={availableFilters}
  onFilterChange={handleFilterChange}
  placeholder="Search or filter..."
/>;
```

## 🛠️ Interactive Components

### Floating Toolbar

**Location**: `/src/components/FloatingToolbar/`

Context-sensitive toolbar that appears when editing rich text content.

**Key Features**:

- Context-aware positioning
- Smooth animations
- Customizable tool sets
- Keyboard accessibility
- Mobile-optimized touch targets

### Search Overlay

**Location**: `/src/components/SearchOverlay/`

Contextual search and suggestion overlay for rich text inputs.

**Key Features**:

- Trigger-based activation
- Real-time search results
- Keyboard navigation
- Fuzzy matching
- Customizable result templates

## 🧭 Navigation Components

### Navbar System

**Location**: `/src/components/Navbar/`

Sophisticated three-column navigation system with perfect center alignment.

**Key Features**:

- Perfect center alignment using CSS Grid
- Three-column flex system
- Responsive design
- Modular architecture
- Comprehensive accessibility support

**Usage Example**:

```jsx
import { Navbar } from '@/components/Navbar';

<Navbar
  leftContent={<NavigationLinks />}
  centerContent={<Brand />}
  rightContent={<UserControls />}
/>;
```

## 🎨 Design System

### Color Palette

```css
/* Brand Colors */
--brand-primary: #edae49; /* Hunyadi Yellow */
--brand-secondary: #f9df74; /* Jasmine */
--brand-tertiary: #f9edcc; /* Cornsilk */
--brand-quaternary: #ea2b1f; /* Chili Red */
--brand-quinary: #61210f; /* Seal Brown */

/* Semantic Colors */
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;
```

### Typography

```css
/* Primary Font */
font-family:
  'Fira Code VF', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;

/* Font Weights */
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing System

```css
/* Spacing Scale */
--space-xs: 0.25rem; /* 4px */
--space-sm: 0.5rem; /* 8px */
--space-md: 1rem; /* 16px */
--space-lg: 1.5rem; /* 24px */
--space-xl: 2rem; /* 32px */
--space-2xl: 3rem; /* 48px */
--space-3xl: 4rem; /* 64px */
```

## 🔧 Component Guidelines

### Component Structure

```
ComponentName/
├── index.ts                 # Export file
├── ComponentName.tsx        # Main component
├── ComponentName.module.css # Component styles
├── ComponentName.test.tsx   # Unit tests
├── ComponentName.stories.tsx # Storybook stories
└── types.ts                # Type definitions
```

### Naming Conventions

- **Components**: PascalCase (`RichInput`, `FilterBar`)
- **Props**: camelCase (`onSubmit`, `enableHashtags`)
- **CSS Classes**: kebab-case (`rich-input`, `filter-bar`)
- **Files**: PascalCase for components, camelCase for utilities

### Accessibility Requirements

- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Responsive Design**: Works on all screen sizes

## 🧪 Testing Guidelines

### Unit Tests

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RichInput } from './RichInput';

describe('RichInput', () => {
  it('should render with placeholder', () => {
    render(<RichInput placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('should handle hashtag input', () => {
    const onHashtag = jest.fn();
    render(<RichInput onHashtag={onHashtag} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#test' } });

    expect(onHashtag).toHaveBeenCalledWith('test');
  });
});
```

### Visual Testing

- Use Storybook for component documentation
- Include all component states and variants
- Test responsive behavior
- Verify accessibility features

## 📚 Resources

### Documentation

- **[Storybook](http://localhost:6006)** - Interactive component documentation
- **[Figma Design System](https://figma.com/idling-app)** - Design specifications
- **[Accessibility Guide](../testing/accessibility/)** - WCAG compliance testing

### Tools

- **React DevTools** - Component debugging
- **Accessibility Insights** - Accessibility testing
- **Lighthouse** - Performance auditing

## 🚀 Getting Started

1. **Browse Components** - Explore available components in Storybook
2. **Check Design System** - Understand colors, typography, and spacing
3. **Read Guidelines** - Follow component structure and naming conventions
4. **Write Tests** - Ensure accessibility and functionality
5. **Update Documentation** - Keep Storybook stories current

## 🔗 Related Sections

- **[Rich Input System](../rich-input/)** - Flagship component details
- **[Testing](../../testing/)** - Testing strategies and tools
- **[Tools](../../tools/)** - Development environment setup

---

_Component library is continuously updated. Last updated: {{ site.time | date: "%B %d, %Y" }}_
