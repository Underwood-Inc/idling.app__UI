---
layout: default
title: Logging System
description: Comprehensive logging utilities with context-aware debugging and production optimization
---

# Logging System

The logging system provides a comprehensive, context-aware logging solution with development debugging support and production optimization. Located in `src/lib/logging/`, this system offers structured logging with performance monitoring and intelligent filtering.

## Overview

The logging system consists of:

- **Core Logger**: Main logging engine with level-based filtering
- **Context Management**: Automatic context injection and tracking
- **Performance Monitoring**: Built-in timing and profiling capabilities
- **Development Tools**: Enhanced debugging with source mapping
- **Production Optimization**: Automatic log level adjustment and filtering

## Key Features

- 🎯 **Context-Aware**: Automatic component and module context injection
- 📊 **Performance Monitoring**: Built-in timing and profiling
- 🔍 **Development Debugging**: Enhanced logging with source maps
- 🚀 **Production Optimized**: Automatic filtering and level adjustment
- 📱 **Environment Aware**: Different behavior for dev/staging/production
- 🎨 **Structured Output**: Consistent formatting with metadata
- 🔧 **Configurable**: Flexible configuration per component/module

## Basic Usage

```tsx
import { createLogger } from '@lib/logging';

const logger = createLogger({
  context: {
    component: 'MyComponent',
    module: 'user-interface'
  }
});

function MyComponent() {
  logger.info('Component mounted');
  logger.debug('Rendering with props:', { userId: 123 });

  const handleClick = () => {
    logger.debug('Button clicked');
    try {
      // Some operation
      logger.info('Operation completed successfully');
    } catch (error) {
      logger.error('Operation failed:', error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Advanced Configuration

```tsx
import { createLogger, createComponentLogger } from '@lib/logging';

// Component-specific logger
const componentLogger = createComponentLogger('UserProfile', {
  enabled: process.env.NODE_ENV === 'development',
  level: 'debug',
  context: {
    feature: 'user-management',
    version: '2.1.0'
  }
});

// Module-specific logger with performance monitoring
const moduleLogger = createLogger({
  context: {
    module: 'api-client',
    service: 'user-service'
  },
  enableProfiling: true,
  enableStackTrace: true
});

function UserProfile({ userId }: { userId: string }) {
  componentLogger.info('UserProfile mounted', { userId });

  useEffect(() => {
    const timer = moduleLogger.startTimer('fetch-user-data');

    fetchUserData(userId)
      .then((data) => {
        timer.end('User data fetched successfully');
        componentLogger.debug('User data loaded:', data);
      })
      .catch((error) => {
        timer.end('User data fetch failed');
        componentLogger.error('Failed to fetch user data:', error);
      });
  }, [userId]);

  return <div>User Profile Content</div>;
}
```

## Logger Configuration

### LoggerConfig Interface

```tsx
interface LoggerConfig {
  context?: LoggerContext;
  level?: LogLevel;
  enabled?: boolean;
  enableProfiling?: boolean;
  enableStackTrace?: boolean;
  enableColors?: boolean;
  enableTimestamp?: boolean;
  enableMetadata?: boolean;
  outputFormat?: 'json' | 'pretty' | 'compact';
}

interface LoggerContext {
  component?: string;
  module?: string;
  feature?: string;
  version?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

### Environment-Based Configuration

```tsx
import { createLogger } from '@lib/logging';

const logger = createLogger({
  // Development: Full logging with debugging
  ...(process.env.NODE_ENV === 'development' && {
    level: 'debug',
    enabled: true,
    enableProfiling: true,
    enableStackTrace: true,
    enableColors: true,
    outputFormat: 'pretty'
  }),

  // Production: Minimal logging, performance focused
  ...(process.env.NODE_ENV === 'production' && {
    level: 'warn',
    enabled: true,
    enableProfiling: false,
    enableStackTrace: false,
    enableColors: false,
    outputFormat: 'json'
  }),

  // Testing: Structured logging for test analysis
  ...(process.env.NODE_ENV === 'test' && {
    level: 'error',
    enabled: false,
    outputFormat: 'compact'
  })
});
```

## Logging Methods

### Basic Logging

```tsx
logger.trace('Detailed trace information');
logger.debug('Debug information for developers');
logger.info('General information');
logger.warn('Warning - something might be wrong');
logger.error('Error occurred', error);
logger.fatal('Critical error - system unusable');
```

### Structured Logging

```tsx
logger.info('User action completed', {
  action: 'profile-update',
  userId: '12345',
  timestamp: Date.now(),
  metadata: {
    fields: ['name', 'email'],
    source: 'user-settings'
  }
});
```

### Performance Monitoring

```tsx
// Timer-based profiling
const timer = logger.startTimer('database-query');
await performDatabaseQuery();
timer.end('Query completed'); // Automatically logs duration

// Manual profiling
const startTime = performance.now();
await performOperation();
logger.profile('Operation duration', performance.now() - startTime);

// Group profiling
logger.group('User Registration Process');
logger.info('Validating user input');
logger.info('Creating user account');
logger.info('Sending welcome email');
logger.groupEnd();
```

## Context Management

### Automatic Context Injection

```tsx
// Context is automatically included in all log messages
const logger = createLogger({
  context: {
    component: 'ShoppingCart',
    userId: getCurrentUserId(),
    sessionId: getSessionId()
  }
});

logger.info('Item added to cart');
// Output: [ShoppingCart] Item added to cart {userId: "123", sessionId: "abc"}
```

### Dynamic Context Updates

```tsx
function ShoppingCart() {
  const logger = createComponentLogger('ShoppingCart');

  const addItem = (item: Item) => {
    // Add temporary context for this operation
    logger
      .withContext({ itemId: item.id, action: 'add-item' })
      .info('Adding item to cart', { item });

    // Context is automatically cleared after the log
  };

  const updateUserId = (userId: string) => {
    // Update persistent context
    logger.setContext({ userId });
    logger.info('User context updated');
  };
}
```

### Context Inheritance

```tsx
// Parent component logger
const parentLogger = createComponentLogger('ParentComponent');

// Child component inherits parent context
const childLogger = parentLogger.createChild('ChildComponent', {
  additionalContext: { childId: 'child-123' }
});

childLogger.info('Child component action');
// Output includes both parent and child context
```

## Development Features

### Enhanced Debugging

```tsx
// Development-only detailed logging
if (process.env.NODE_ENV === 'development') {
  logger.debug('Component state:', {
    props: this.props,
    state: this.state,
    refs: Object.keys(this.refs)
  });
}

// Conditional logging with lambda functions (performance optimized)
logger.debug(() => `Expensive computation result: ${expensiveOperation()}`);
```

### Source Map Integration

```tsx
// Automatically includes source file and line numbers in development
logger.error('Something went wrong');
// Output: [Component] Something went wrong (MyComponent.tsx:42:15)
```

### Console Integration

```tsx
// Integrates with browser dev tools
logger.logClick({ element: 'submit-button', coordinates: { x: 100, y: 200 } });
logger.logNavigation('/dashboard', { from: '/profile' });
logger.logError(error, { context: 'form-submission' });
```

## Production Optimization

### Automatic Log Level Adjustment

```tsx
// Automatically adjusts log levels based on environment
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
});

// Debug messages are completely stripped in production builds
logger.debug('This will not appear in production');
```

### Performance Monitoring

```tsx
// Production-safe performance monitoring
const logger = createLogger({
  enableProfiling: process.env.NODE_ENV !== 'production'
});

// Profiling is automatically disabled in production
const timer = logger.startTimer('expensive-operation');
await performExpensiveOperation();
timer.end(); // No-op in production
```

### Memory Management

```tsx
// Automatic cleanup of log buffers and contexts
logger.cleanup(); // Clears internal buffers
logger.resetContext(); // Clears context data

// Automatic cleanup on component unmount
useEffect(() => {
  return () => logger.cleanup();
}, []);
```

## Integration Examples

### React Component Integration

```tsx
import { createComponentLogger } from '@lib/logging';

function UserDashboard({ userId }: { userId: string }) {
  const logger = createComponentLogger('UserDashboard', {
    context: { userId },
    enabled: true
  });

  useEffect(() => {
    logger.info('Dashboard mounted');

    return () => {
      logger.info('Dashboard unmounted');
      logger.cleanup();
    };
  }, []);

  const handleAction = async (action: string) => {
    const timer = logger.startTimer(`action-${action}`);

    try {
      await performUserAction(action);
      timer.end('Action completed successfully');
      logger.info('User action completed', { action });
    } catch (error) {
      timer.end('Action failed');
      logger.error('User action failed', { action, error });
    }
  };

  return <div>Dashboard Content</div>;
}
```

### API Client Integration

```tsx
import { createLogger } from '@lib/logging';

class ApiClient {
  private logger = createLogger({
    context: {
      module: 'api-client',
      service: 'user-service'
    },
    enableProfiling: true
  });

  async fetchUser(userId: string) {
    const requestId = generateRequestId();
    const timer = this.logger.startTimer('fetch-user');

    this.logger.info('Fetching user data', { userId, requestId });

    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      timer.end('User data fetched successfully');
      this.logger.info('User data retrieved', {
        userId,
        requestId,
        dataSize: JSON.stringify(data).length
      });

      return data;
    } catch (error) {
      timer.end('User data fetch failed');
      this.logger.error('Failed to fetch user data', {
        userId,
        requestId,
        error
      });
      throw error;
    }
  }
}
```

### Error Boundary Integration

```tsx
import { createComponentLogger } from '@lib/logging';

class ErrorBoundary extends React.Component {
  private logger = createComponentLogger('ErrorBoundary');

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.logger.error('Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    });

    // Send to error reporting service
    this.reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      this.logger.warn('Rendering error fallback UI');
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## Testing

### Unit Tests

```tsx
import { createLogger } from '@lib/logging';

describe('Logger', () => {
  test('creates logger with context', () => {
    const logger = createLogger({
      context: { component: 'TestComponent' }
    });

    expect(logger.getContext()).toEqual({ component: 'TestComponent' });
  });

  test('logs with correct level', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const logger = createLogger({ level: 'info' });

    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });
});
```

### Integration Tests

```tsx
test('component logs lifecycle events', () => {
  const consoleSpy = jest.spyOn(console, 'log');

  const { unmount } = render(<MyComponent />);

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('Component mounted')
  );

  unmount();

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('Component unmounted')
  );
});
```

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Console API**: console.log, console.group, console.time
- **Performance API**: performance.now(), performance.mark()
- **Fallback**: Graceful degradation with basic console.log

## Related Utilities

- **Error Handling**: Error boundary and error reporting integration
- **Performance Monitoring**: Built-in timing and profiling capabilities
- **Development Tools**: Enhanced debugging and source mapping
- **Context Management**: Automatic context injection and inheritance
