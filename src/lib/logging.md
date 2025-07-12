---
title: 'Logging System'
description: 'Structured logging utilities and monitoring integrations'
sidebar_position: 7
---

# Logging System

A unified, environment-aware logging solution with comprehensive features for development and production use.

## Features

- **Environment-aware**: Adapts behavior based on development/production/test environments
- **Context-aware**: Distinguishes between client/server contexts
- **Performance optimized**: Conditional logging with minimal overhead
- **ESLint compliant**: Uses approved console methods
- **Structured output**: Automatic grouping and formatting
- **Type-safe**: Full TypeScript support

## Basic Usage

```typescript
import { createLogger } from '@lib/logging';

const logger = createLogger({
  context: {
    module: 'MyComponent'
  }
});

logger.info('User action completed', { userId: '123', action: 'login' });
logger.error('API call failed', error, { endpoint: '/api/users' });
```

## Global Raw Logger Output (Browser Only)

For debugging and copying log data, you can enable raw output mode that converts all logger output to copyable, structured text format.

### Enable Raw Output

In your browser console, run:

```javascript
// Enable raw output for all logger instances
enableRawLoggerOutput();
```

This will:

- Override all console methods globally
- Convert objects to structured, copyable text
- Add timestamps to all log entries
- Remove styling and formatting
- Convert console groups to regular info messages (no expanding needed)
- Make all log data easily copyable

### Example Output

**Normal logging:**

```
🔍 [MyComponent] User action completed {userId: "123", action: "login"}
```

**Raw output mode:**

```
[2024-01-15T10:30:45.123Z] INFO: 🔍 [MyComponent] User action completed {
  userId: "123",
  action: "login"
}
```

### Disable Raw Output

To restore normal logging:

```javascript
// Restore normal logging
disableRawLoggerOutput();
```

### Check Status

```javascript
// Check if raw output is enabled
isRawLoggerOutputEnabled(); // returns true/false
```

### Use Cases

- **Debugging**: Copy complex object structures for analysis
- **Bug reports**: Share exact log data with team members
- **Testing**: Verify log output in automated tests
- **Documentation**: Create examples from actual log output

### Important Notes

- Only works in browser environments (not Node.js)
- Affects **ALL** console output, not just logger instances
- Automatically handles nested objects, arrays, and complex data structures
- Converts console groups to regular messages (no expanding required)
- Preserves original console methods and can be toggled on/off
- No changes needed to existing logger code - works globally

## Logger Types

### Generic Logger

```typescript
import { createLogger } from '@lib/logging';
const logger = createLogger();
```

### Client Logger

```typescript
import { createClientLogger } from '@lib/logging';
const logger = createClientLogger();
```

### Server Logger

```typescript
import { createServerLogger } from '@lib/logging';
const logger = createServerLogger();
```

### Debug Logger

```typescript
import { createDebugLogger } from '@lib/logging';
const logger = createDebugLogger();
```

## Configuration

```typescript
const logger = createLogger({
  level: 'DEBUG',
  context: {
    module: 'UserService',
    component: 'LoginForm'
  },
  performance: {
    enabled: true,
    slowThreshold: 1000
  }
});
```
