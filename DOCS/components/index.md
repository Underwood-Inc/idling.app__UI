---
layout: default
title: Components
description: Comprehensive documentation for all Idling.app UI components
permalink: /components/
---

# Component Documentation

Welcome to the Idling.app component library documentation. This section provides comprehensive guides, specifications, and implementation details for all UI components in the application.

## Available Components

### Rich Input System

**Location**: [Rich Input System](/components/rich-input-system/)

A sophisticated text editing component that transforms basic text input into an intelligent, interactive writing experience. Features automatic detection and enhancement of hashtags, user mentions, URLs, and emojis with real-time suggestions and auto-completion.

**Key Features**:

- Hashtag detection and enhancement
- User mention system with search
- URL auto-conversion with rich previews
- Emoji support with picker
- Image paste functionality
- Floating toolbar for quick access
- Smart search overlays

### Filter Bar

**Location**: [Filter Bar](/components/filter-bar/)

Advanced filtering interface with smart inputs and real-time search capabilities. Combines text input with smart suggestions, filter pills, and real-time search to create a powerful content discovery experience.

### Floating Toolbar

**Location**: [Floating Toolbar](/components/floating-toolbar/)

Context-sensitive toolbar that appears when editing rich text content. Provides quick access to common formatting and insertion tools, enhancing the text editing experience without cluttering the interface.

### Search Overlay

**Location**: [Search Overlay](/components/search-overlay/)

Contextual search and suggestion overlay for rich text inputs. Appears automatically when users type trigger characters, offering real-time suggestions and search results.

### Navbar System

**Location**: [Navbar Component](/components/navbar/)

Sophisticated three-column navigation system that ensures perfect centering of the brand (avatar + "Idling.app" text) while providing flexible space for navigation links and authentication controls. Uses a hybrid CSS Grid and Flexbox approach for optimal layout control.

**Key Features**:

- Perfect center alignment using CSS Grid
- Three-column flex system (navigation, brand, authentication)
- Responsive design with mobile-first approach
- Modular component architecture
- Comprehensive accessibility support
- Performance-optimized animations

---

## Component Categories

### Input Components

- **Rich Input System** - Advanced text editing with smart enhancements
- **Filter Bar** - Smart filtering interface with real-time search

### Interactive Components

- **Floating Toolbar** - Context-sensitive editing toolbar
- **Search Overlay** - Contextual search and suggestion interface

### Navigation Components

- **Navbar System** - Three-column layout with perfect center alignment

### Display Components

- _Documentation coming soon..._

---

## Documentation Standards

Each component documentation includes:

- **Business Requirements** - What the component does and why
- **Technical Specifications** - How it works under the hood
- **Usage Examples** - Code samples and implementation guides
- **API Reference** - Props, methods, and configuration options
- **Design Guidelines** - Visual specifications and best practices
- **Accessibility** - WCAG compliance and screen reader support

## Contributing

To add new component documentation:

1. Create a new directory under `/components/[component-name]/`
2. Add an `index.md` file with the main documentation
3. Include additional files as needed (API reference, examples, etc.)
4. Update this index page to include the new component
5. Ensure proper navigation links are added

---

_For technical support or questions about component implementation, please refer to the [Development](/development/) section or contact the development team._
