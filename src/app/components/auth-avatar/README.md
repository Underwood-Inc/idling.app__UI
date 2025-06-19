# AuthAvatar Components

## Overview

The AuthAvatar components provide consistent avatar rendering for the currently authenticated user throughout the application. These components ensure that the user's avatar appearance remains the same across all parts of the app by using a consistent seed based on the user's ID.

## Components

### `AuthAvatar` (Client Component)

Used in client-side components that need to display the current user's avatar.

```tsx
import { AuthAvatar } from '@/app/components/auth-avatar';

function MyClientComponent() {
  return <AuthAvatar size="md" enableTooltip={true} />;
}
```

### `AuthAvatarServer` (Server Component)

Used in server-side components that need to display the current user's avatar.

```tsx
import { AuthAvatarServer } from '@/app/components/auth-avatar';

async function MyServerComponent() {
  return <AuthAvatarServer size="sm" />;
}
```

## Props

Both components accept the same props:

- `size?: AvatarPropSizes` - Size of the avatar (default: 'md')
- `enableTooltip?: boolean` - Whether to show tooltip on hover (default: false)
- `tooltipScale?: 2 | 3 | 4` - Scale factor for tooltip (default: 2)
- `className?: string` - Additional CSS classes (default: '')

## Seed Strategy

The components use the following fallback strategy for the avatar seed:

1. **User ID** (primary) - Most stable identifier
2. **User name** (fallback) - If ID is not available
3. **User email** (fallback) - If ID and name are not available
4. **"anonymous"** (fallback) - If no session exists

This ensures consistent avatar appearance regardless of how the user data is structured.

## Why These Components?

### Problem Solved

Previously, avatars were generated using inconsistent seeds like `user.username || user.email || user.id`. This caused avatars to change appearance when:

- Profile data was fetched from different sources (submissions table vs users table)
- User data structure differed between authentication states
- Bio updates returned different user object formats

### Solution

These dedicated components:

- Always use the user ID as the primary seed for consistency
- Provide a single source of truth for authenticated user avatars
- Ensure the same avatar appearance across the entire application
- Handle different authentication states gracefully

## Usage Guidelines

- Use `AuthAvatar` in client components (pages, interactive elements)
- Use `AuthAvatarServer` in server components (layouts, static elements)
- Always use these components instead of directly using `Avatar` with session data
- For non-authenticated user avatars (other users), continue using the regular `Avatar` component 