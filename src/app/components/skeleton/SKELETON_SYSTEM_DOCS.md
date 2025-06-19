# Skeleton System Architecture Documentation

## 🏗️ How the Skeleton System Works

### Overview
The skeleton system provides loading placeholders that match the actual content layout, preventing jarring height changes and providing better UX during data loading.

## 📊 Data Flow & Loading States

### 1. **State Management Flow**
```
useSubmissionsManager (Jotai atoms) 
    ↓
PostsManager (state orchestrator)
    ↓  
SubmissionsList (UI renderer)
    ↓
Skeleton Components (loading placeholders)
```

### 2. **Loading State Sources**
The `isLoading` boolean comes from the Jotai atom in `useSubmissionsManager`:

```typescript
// In useSubmissionsManager.ts
const [submissionsState, setSubmissionsState] = useAtom(
  getSubmissionsStateAtom(contextId)
);

// State structure
interface SubmissionsState {
  loading: boolean;  // ← This becomes isLoading
  data?: {
    submissions: any[];
    pagination: PaginationInfo;
  };
  error?: string;
}
```

### 3. **Loading Triggers**
Loading state becomes `true` when:
- Initial page load
- Filter changes (tags, search)
- Page navigation
- Page size changes  
- Manual refresh

Loading state becomes `false` when:
- API response received (success or error)
- Component unmount

## 🎨 Skeleton Component Hierarchy

### 1. **Core Components** (`SkeletonLoader.tsx`)
```typescript
SkeletonText     // Text placeholders
SkeletonBox      // Block/container placeholders  
SkeletonCircle   // Avatar/icon placeholders
SkeletonLoader   // Main orchestrator with smart/manual modes
```

### 2. **Smart Skeleton System** (`useSmartPostsSkeleton.tsx`)
```typescript
useSmartPostsSkeleton() // Hook for posts-specific skeletons
├── SubmissionCardSkeleton // Individual post card skeleton
├── PaginationSkeleton     // Pagination controls skeleton
└── SmartPostsSkeleton     // Convenience component
```

### 3. **Integration Points**
```typescript
// In SubmissionsList.tsx - Two loading conditions:

// 1. Session loading
if (status === 'loading') {
  return <SmartPostsSkeleton submissionCount={3} showPagination={false} />;
}

// 2. Data loading  
if (isLoading) {
  return (
    <div className="submissions-list__loading">
      {capturedLayout ? (
        getSmartSkeletonLoader(isLoading)  // Smart skeleton based on previous layout
      ) : (
        <SmartPostsSkeleton               // Fallback skeleton
          submissionCount={5}
          showPagination={true}
          enableThreadMode={enableThreadMode}
        />
      )}
    </div>
  );
}
```

## 🧠 Smart Skeleton Features

### 1. **Layout Capture System**
```typescript
// Captures actual DOM structure when data loads
const captureCurrentLayout = () => {
  // Analyzes current posts list structure
  const submissionElements = containerRef.current.querySelectorAll(
    '.submission__wrapper, .submission-thread'
  );
  const paginationElement = containerRef.current.querySelector(
    '.submissions-list__pagination'
  );
  
  // Creates config matching actual layout
  const config: PostsSkeletonConfig = {
    submissionCount: Math.max(submissionElements.length, 3),
    showPagination: !!paginationElement,
    enableThreadMode: threadElements.length > 0
  };
}
```

### 2. **Auto-Adaptive Skeletons**
- **Submission Count**: Matches number of actual posts
- **Pagination**: Shows only if pagination exists
- **Thread Mode**: Includes reply skeletons if in thread mode
- **Random Variation**: Simulates natural content variation (tags, descriptions)

### 3. **Fallback Strategy**
```typescript
// If layout capture fails or isn't available yet:
<SmartPostsSkeleton
  submissionCount={5}      // Default count
  showPagination={true}    // Safe default
  enableThreadMode={false} // Conservative default
/>
```

## 🔄 State Lifecycle

### 1. **Initial Load**
```
1. Page loads → useSubmissionsManager initializes
2. loading: true → SubmissionsList shows fallback skeleton
3. API call completes → loading: false → Real content shows
4. useEffect captures layout → Smart skeleton ready for next load
```

### 2. **Filter Changes** 
```
1. User clicks tag → addFilter() called
2. URL updates → useSubmissionsManager detects change
3. loading: true → SubmissionsList shows smart skeleton (if captured)
4. API call → loading: false → Content updates
5. Layout re-captured if structure changed
```

### 3. **Development Override**
```
1. Dev toggle Force ON → shouldShowSkeleton: true
2. getSmartSkeletonLoader() ignores isLoading
3. Always returns skeleton regardless of actual loading state
4. Perfect for design work without waiting for loading
```

## 🎛️ Development Mode Integration

### How Dev Controls Work
```typescript
// In useSmartPostsSkeleton.tsx
const getSmartSkeletonLoader = (isLoading: boolean = true) => {
  // Check dev mode override
  const shouldShow = (() => {
    if (process.env.NODE_ENV === 'development' && isDevModeActive) {
      return shouldShowSkeleton; // Dev mode controls
    }
    return isLoading; // Normal loading state
  })();

  if (!shouldShow) return null;
  return generatePostsSkeleton(capturedLayout);
};
```

### Dev Mode States
- **Auto**: Normal behavior (`shouldShow = isLoading`)
- **Force ON**: Always show (`shouldShow = true`)  
- **Force OFF**: Never show (`shouldShow = false`)

## 🚀 Performance Optimizations

### 1. **DOM Analysis Caching**
- Layout captured once and reused
- No re-analysis until content structure changes
- Fallback prevents analysis failures

### 2. **Conditional Rendering**
- Skeletons only render when needed
- Early returns prevent unnecessary work
- Smart fallbacks for edge cases

### 3. **Component Separation**
- Skeleton logic separated from business logic
- Reusable components across different contexts
- Tree-shaking removes dev tools in production

## 🧪 Testing Strategy

### Manual Testing
1. **Force ON**: See skeleton designs without loading
2. **Force OFF**: Test content layouts without interference  
3. **Auto**: Verify normal loading behavior

### Edge Cases
- Empty result sets
- Network failures
- Rapid filter changes
- Component unmounting during load

## 🔍 Debugging Tips

### Console Logs
The system includes extensive logging:
```
📸 [SKELETON] Captured layout: {...}
📋 [SUBMISSIONS_LIST] Rendering with state: {...}
🔄 [MANAGER] fetchSubmissions called with: {...}
```

### Development Panel
- Shows current mode and status
- Visual indicators for active overrides
- Keyboard shortcuts for quick testing

## 🏁 Summary

The skeleton system provides:
1. **Smooth Loading UX**: No height jumps or layout shifts
2. **Smart Adaptation**: Matches actual content structure  
3. **Development Tools**: Easy testing and design iteration
4. **Performance**: Minimal overhead with smart caching
5. **Fallback Safety**: Graceful degradation for edge cases

The key insight is that `isLoading` from `useSubmissionsManager` controls when skeletons show, and the dev toggle system can override this behavior for testing purposes. 