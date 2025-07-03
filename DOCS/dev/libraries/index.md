---
layout: default
title: '📚 Libraries'
description: 'Shared utilities and services for Idling.app'
nav_order: 3
parent: '🛠️ Development'
has_children: true
---

# 📚 Libraries

Shared utilities, services, and reusable code for the Idling.app ecosystem.

## Overview

Our libraries provide consistent, tested, and well-documented solutions for common development needs:

- **Core Services**: Authentication, caching, logging, and data management
- **Utilities**: Helper functions, parsers, and common operations
- **React Hooks**: Custom hooks for state management and side effects

## Library Structure

```
src/lib/
├── services/           # Core business services
│   ├── auth/          # Authentication service
│   ├── cache/         # Caching layer
│   ├── logging/       # Logging service
│   └── data/          # Data management
├── utils/             # Utility functions
│   ├── parsers/       # Data parsing utilities
│   ├── validators/    # Input validation
│   └── formatters/    # Data formatting
└── hooks/             # React hooks
    ├── useAuth.ts     # Authentication hook
    ├── useCache.ts    # Caching hook
    └── useApi.ts      # API interaction hook
```

## Design Principles

### 1. **Single Responsibility**

Each library has a clear, focused purpose:

```typescript
// ✅ Good - focused utility
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// ❌ Bad - multiple responsibilities
export function formatAndValidateCurrency(amount: number): string | null {
  if (amount < 0) return null;
  return formatCurrency(amount);
}
```

### 2. **Type Safety**

All libraries are fully typed with TypeScript:

```typescript
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // Implementation
}
```

### 3. **Error Handling**

Consistent error handling across all libraries:

```typescript
export class LibraryError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}
```

## Available Libraries

### [⚙️ Core Services](./services/)

Essential services for application functionality:

- **AuthService**: User authentication and session management
- **CacheService**: Redis-based caching with TTL support
- **LoggingService**: Structured logging with multiple transports
- **DataService**: Database operations and query building

### [🔧 Utilities](./utils/)

Helper functions and common operations:

- **Parsers**: JSON, CSV, and data format parsers
- **Validators**: Input validation and sanitization
- **Formatters**: Date, currency, and text formatting
- **Crypto**: Hashing, encryption, and security utilities

### [🎣 React Hooks](./hooks/)

Custom React hooks for common patterns:

- **useAuth**: Authentication state management
- **useApi**: API calls with loading states
- **useCache**: Client-side caching
- **useLocalStorage**: Persistent local storage

## Usage Examples

### Service Usage

```typescript
import { AuthService, CacheService } from '@/lib/services';

// Authentication
const authService = new AuthService();
const user = await authService.getCurrentUser();

// Caching
const cacheService = new CacheService();
await cacheService.set('user:123', user, 3600);
```

### Utility Usage

```typescript
import { formatCurrency, validateEmail } from '@/lib/utils';

// Format currency
const price = formatCurrency(29.99); // "$29.99"

// Validate email
const isValid = validateEmail('user@example.com'); // true
```

### Hook Usage

```typescript
import { useAuth, useApi } from '@/lib/hooks'

function UserProfile() {
  const { user, loading } = useAuth()
  const { data: posts, loading: postsLoading } = useApi('/api/posts')

  if (loading || postsLoading) return <Loading />

  return <UserDashboard user={user} posts={posts} />
}
```

## Testing

All libraries include comprehensive tests:

```typescript
// Example test structure
describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should authenticate valid user', async () => {
    const result = await authService.login('user@example.com', 'password');
    expect(result.success).toBe(true);
  });
});
```

## Documentation Standards

Each library includes:

- **README.md**: Overview and quick start
- **API.md**: Detailed API documentation
- **EXAMPLES.md**: Usage examples
- **CHANGELOG.md**: Version history

## Contributing

### Adding New Libraries

1. Create directory structure:

```bash
mkdir -p src/lib/new-library/{__tests__,types}
```

2. Create core files:

```bash
touch src/lib/new-library/{index.ts,README.md,API.md}
```

3. Write tests first (TDD approach)
4. Implement functionality
5. Document API and examples
6. Update this index page

### Library Guidelines

- **Export everything from index.ts**
- **Use consistent naming conventions**
- **Include TypeScript declarations**
- **Write comprehensive tests**
- **Document all public APIs**

## Performance Considerations

### Bundle Size

- Tree-shakeable exports
- Minimal dependencies
- Lazy loading where appropriate

### Runtime Performance

- Efficient algorithms
- Proper caching strategies
- Memory leak prevention

## Next Steps

- Explore [⚙️ Core Services](./services/) for business logic
- Check [🔧 Utilities](./utils/) for helper functions
- Review [🎣 React Hooks](./hooks/) for state management
- See [🧪 Testing](../testing/) for testing strategies
