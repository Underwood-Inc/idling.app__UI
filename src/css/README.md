---
title: 'Modular CSS Architecture'
description: 'CSS architecture and styling system for Idling.app'
---

# Modular CSS Architecture

This directory contains the modular CSS architecture for the Idling.app documentation site, refactored from a single monolithic file into organized, maintainable modules.

## File Structure

```
src/css/
├── custom.css      - Main import file (entry point)
├── variables.css   - Design tokens and CSS custom properties
├── base.css        - Fundamental styles and typography
├── navigation.css  - Navigation components (navbar, sidebar, etc.)
├── components.css  - Reusable UI components
├── mermaid.css     - Diagram-specific styling with interactive features
├── responsive.css  - Media queries and responsive design
└── README.md       - This documentation
```

## Module Responsibilities

### `variables.css` - Design System Foundation

- CSS custom properties (CSS variables)
- Color palette and brand colors
- Typography scales and font families
- Spacing and sizing scales
- Border radius and transition definitions
- Z-index scale
- Glass/translucent effect definitions

### `base.css` - Fundamental Styling

- Global resets and base element styling
- Typography hierarchy (h1-h6)
- Code block and inline code styling
- Blockquote styling
- Status badges
- Layout containers

### `navigation.css` - Navigation Components

- Navbar styling
- Sidebar and menu components
- Breadcrumb navigation
- Pagination components
- Footer styling
- Search component styling

### `components.css` - UI Components

- Tables and data display
- Component cards
- Example sections
- List styling
- Alert/admonition components
- API documentation components

### `mermaid.css` - Interactive Diagrams

- Base mermaid diagram styling
- Interactive viewer controls
- Pan/zoom/fullscreen functionality
- Diagram type-specific styling
- Loading and error states
- Mobile optimizations for diagrams

### `responsive.css` - Responsive Design

- Mobile-first breakpoints
- Tablet and desktop optimizations
- Print styles
- High DPI display optimizations
- Accessibility (reduced motion)

## Import Order

The modules are imported in dependency order in `custom.css`:

1. **Variables** - Foundation for all other modules
2. **Base** - Fundamental styles that other modules build upon
3. **Navigation** - Layout-critical navigation components
4. **Components** - Reusable UI components
5. **Mermaid** - Specialized diagram functionality
6. **Responsive** - Responsive overrides and media queries

## Best Practices

### Adding New Styles

1. Determine which module the new styles belong to
2. Use existing CSS custom properties when possible
3. Follow the established naming conventions
4. Add responsive considerations to `responsive.css`

### Modifying Existing Styles

1. Locate the appropriate module for the component
2. Make changes within that module only
3. Update related responsive styles if needed
4. Test across all breakpoints

### Creating New Modules

1. Keep modules focused on a single responsibility
2. Add imports to `custom.css` in the appropriate order
3. Document the module's purpose in this README
4. Use existing design tokens from `variables.css`

## Benefits of This Architecture

- **Maintainability**: Easy to find and update specific styles
- **Organization**: Logical grouping of related styles
- **Collaboration**: Multiple developers can work on different modules
- **Performance**: Better CSS bundling and optimization opportunities
- **Debugging**: Easier to isolate and fix style issues
- **Scalability**: New features can be added without growing a monolithic file

## Migration Notes

This modular structure replaces the previous 1000+ line monolithic `custom.css` file. All existing functionality is preserved while improving maintainability and organization.
