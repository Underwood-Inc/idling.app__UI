'use client';

/**
 * Client-Side Secure Logout Hook
 *
 * IMPORTANT: This file contains next-auth/react imports and should only be used
 * in client components to avoid Edge Runtime compatibility issues.
 */

import { performSecureLogout } from './secure-logout';

/**
 * React Hook for Secure Logout
 *
 * Provides a hook that can be used in React components to perform secure logout
 * with comprehensive cache clearing and session invalidation.
 *
 * IMPORTANT: This function should only be used in client components due to next-auth/react dependency
 */
export function useSecureLogout() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      secureLogout: async () => {
        throw new Error(
          'useSecureLogout can only be used in client components'
        );
      }
    };
  }

  return {
    secureLogout: async (
      options?: Parameters<typeof performSecureLogout>[0]
    ) => {
      // First perform the cache clearing
      const result = await performSecureLogout(options);

      // Then trigger NextAuth logout (dynamic import to avoid Edge Runtime issues)
      try {
        const { signOut } = await import('next-auth/react');

        await signOut({
          redirect: false, // We'll handle redirect after cache clearing
          callbackUrl: '/'
        });
      } catch (error) {
        console.warn(
          'NextAuth signOut failed, proceeding with manual logout:',
          error
        );
      }

      // Force a hard refresh to ensure clean state
      setTimeout(() => {
        window.location.replace('/');
      }, 500);

      return result;
    }
  };
}
