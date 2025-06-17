# Development Skeleton Toggle System

A development-only tool for controlling skeleton loading states throughout the application.

## 🔒 Security Features

- **Build-time exclusion**: Completely removed from production builds via Next.js webpack configuration
- **Runtime checks**: Multiple layers of `NODE_ENV` checks prevent any dev code execution in production
- **Tree-shaking**: Uses dynamic imports that are eliminated during production bundling
- **Zero footprint**: No dev tools code, styles, or functionality exists in production bundles

## 🎛️ Features

### Three Operating Modes

1. **Auto (Default)**: Normal loading behavior - skeletons show during actual loading states
2. **Force ON**: All skeleton components show regardless of loading state
3. **Force OFF**: No skeletons show, overriding all loading states

### Global Control

- Controls ALL skeleton components throughout the application
- Works with both manual and smart skeleton configurations
- Overrides component-level loading states when active

### Developer UX

- **Floating Action Button**: Always accessible in bottom-right corner
- **Keyboard Shortcut**: `Ctrl+Shift+S` to toggle panel
- **Visual Indicator**: Red pulsing dot when override is active
- **Status Display**: Clear indication of current mode and its effects

## 🚀 Usage

### Automatic Integration

The dev tools are automatically available in development mode:

1. Start the development server (`npm run dev`)
2. Navigate to any page with skeleton loaders
3. Use `Ctrl+Shift+S` or click the floating button in bottom-right
4. Select your desired mode

### For Component Developers

Components using skeleton loaders automatically respect dev mode settings:

```tsx
// Existing skeleton components work without changes
<SkeletonLoader config={config} isLoading={isLoading} />

// Smart skeletons respect dev mode automatically  
const { getSmartSkeletonLoader } = useSmartPostsSkeleton();
{getSmartSkeletonLoader(isLoading)}
```

### Testing Scenarios

- **Force ON**: Perfect for designing skeleton layouts without waiting for loading
- **Force OFF**: Test actual content layouts without skeleton interference  
- **Auto**: Verify normal loading behavior works correctly

## 🏗️ Technical Implementation

### Build-time Exclusion

```javascript
// next.config.js
webpack: (config, { webpack, dev }) => {
  if (!dev) {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^.*\/dev-tools\/.*$/,
        contextRegExp: /src\/app\/components/
      })
    );
  }
}
```

### Runtime Protection

```typescript
// Development-only imports
let useDevSkeletonState: () => DevState;

if (process.env.NODE_ENV === 'development') {
  const devModule = require('../dev-tools/DevSkeletonToggle');
  useDevSkeletonState = devModule.useDevSkeletonState;
} else {
  // Production fallback - returns inactive state
  useDevSkeletonState = () => ({ 
    shouldShowSkeleton: false, 
    isDevModeActive: false 
  });
}
```

### Component Integration

```typescript
const { shouldShowSkeleton, isDevModeActive } = useDevSkeletonState();

const shouldShow = (() => {
  if (process.env.NODE_ENV === 'development' && isDevModeActive) {
    return shouldShowSkeleton;
  }
  return forceShow || isLoading;
})();
```

## 📦 Files Structure

```
src/app/components/dev-tools/
├── DevSkeletonToggle.tsx      # Main toggle component
├── DevSkeletonToggle.css      # Styles (dev-only)
└── README.md                  # This documentation
```

## 🔍 Verification

To verify dev tools are excluded from production:

1. Build for production: `npm run build`
2. Search build output for dev tool references (should find none)
3. Check bundle analyzer for dev tool code (should be absent)
4. Test production deployment (no dev tools should appear)

## 🎨 Styling

- **Modern Design**: Clean, professional interface
- **Dark Mode**: Automatic system preference detection
- **Responsive**: Works on mobile and desktop
- **Accessible**: ARIA labels, keyboard navigation, reduced motion support
- **Non-intrusive**: Overlay design doesn't interfere with app layout

## ⚠️ Important Notes

- Only available in `NODE_ENV=development`
- Requires manual integration in page components (already done for posts/my-posts)
- Uses Jotai for state management (shares app state management system)
- CSS uses modern features (flexbox, CSS custom properties)
- Keyboard shortcut respects user preferences and doesn't conflict with browser shortcuts 