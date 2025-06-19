# Authentication Patterns Guide

## Overview

This document establishes the correct authentication patterns for the application. Following these patterns ensures consistency, security, and maintainability.

## ✅ Correct Patterns

### Server-Side Components (RSC)

```tsx
import { auth } from '@/lib/auth';

async function MyServerComponent() {
  const session = await auth();
  
  // Check if user is authenticated
  const isAuthenticated = !!session?.user?.id;
  
  // Check if user owns a resource
  const isOwner = session?.user?.id === resourceOwnerId;
  
  // Use user ID for stable comparisons
  const currentUserId = session?.user?.id;
  
  return (
    <div>
      {isAuthenticated && <p>Welcome back!</p>}
      {isOwner && <button>Edit</button>}
    </div>
  );
}
```

### Client-Side Components

```tsx
'use client';

import { useSession } from 'next-auth/react';

function MyClientComponent() {
  const { data: session } = useSession();
  
  // Check if user is authenticated
  const isAuthenticated = !!session?.user?.id;
  
  // Check if user owns a resource
  const isOwner = session?.user?.id === resourceOwnerId;
  
  // Use user ID for stable comparisons
  const currentUserId = session?.user?.id;
  
  return (
    <div>
      {isAuthenticated && <p>Welcome back!</p>}
      {isOwner && <button>Edit</button>}
    </div>
  );
}
```

## ❌ Incorrect Patterns (DO NOT USE)

### Complex Username Matching
```tsx
// ❌ WRONG - Error-prone and inconsistent
const isOwnProfile = session?.user && (
  userProfile.id === session.user.id ||
  userProfile.username === session.user.name ||
  userProfile.username === session.user.email
);
```

### Using `providerAccountId`
```tsx
// ❌ WRONG - Legacy pattern, should use session.user.id
const isOwner = session?.user?.providerAccountId === authorId;
```

### Inconsistent Checks
```tsx
// ❌ WRONG - Mix of different identifiers
const canEdit = session?.user?.name === author || 
               session?.user?.email === userEmail;
```

## Key Principles

### 1. Always Use `session.user.id`

The `session.user.id` field is the most stable and reliable identifier:

```tsx
// ✅ Correct
const isOwner = session?.user?.id === resourceOwnerId;

// ❌ Wrong
const isOwner = session?.user?.providerAccountId === resourceOwnerId;
```

### 2. Use Proper Authentication Method

- **Server components**: Use `auth()` from `@/lib/auth`
- **Client components**: Use `useSession()` from `next-auth/react`

### 3. Consistent Property Access

Always use optional chaining for safety:

```tsx
// ✅ Correct
const userId = session?.user?.id;
const isAuthenticated = !!session?.user?.id;

// ❌ Wrong
const userId = session.user.id; // Could throw error
```

### 4. Simple Boolean Checks

For authentication status:

```tsx
// ✅ Correct
const isAuthenticated = !!session?.user?.id;

// ❌ Wrong
const isAuthenticated = session && session.user && session.user.id;
```

## Migration Notes

If you encounter legacy patterns using `providerAccountId`, replace them with `session.user.id`:

```tsx
// Before
session?.user?.providerAccountId === authorId

// After  
session?.user?.id === authorId
```

## Session Structure

Our session object has this structure:

```typescript
interface Session {
  user: {
    id: string;           // ✅ Use this for all comparisons
    name?: string;        // Display name
    email?: string;       // User email
    image?: string;       // Profile image URL
    providerAccountId?: string; // ❌ Legacy, don't use
  };
}
```

## Examples

### Profile Ownership Check
```tsx
// ✅ Correct
const isOwnProfile = session?.user?.id === userProfile.id;
```

### Post/Comment Ownership
```tsx
// ✅ Correct
const canEdit = session?.user?.id === post.authorId;
const canDelete = session?.user?.id === comment.authorId;
```

### Authorization for Actions
```tsx
// ✅ Correct
const canReply = !!session?.user?.id;
const canCreatePost = !!session?.user?.id;
```

## Testing

When writing tests, mock the session with the `id` field:

```tsx
const mockSession = {
  user: {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com'
  }
};
```

## Conclusion

Following these patterns ensures:
- **Consistency** across the entire application
- **Security** through proper identity verification  
- **Maintainability** with simple, predictable patterns
- **Reliability** using stable identifiers

Always use `session.user.id` for all authentication and authorization checks! 