'use client';

/* eslint-disable no-console */

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * SessionRefreshHandler - Handles OAuth callback session refresh
 *
 * This component detects when a user returns from OAuth provider
 * and forces a session refresh to ensure the UI reflects the new
 * authentication state without requiring a hard refresh.
 */
export function SessionRefreshHandler() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessedCallback = useRef(false);
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;

  useEffect(() => {
    // Skip if we've already processed a callback in this session
    if (hasProcessedCallback.current) return;

    // Check if this looks like an OAuth callback with more comprehensive detection
    const isCallback =
      searchParams.get('code') ||
      searchParams.get('state') ||
      searchParams.get('oauth_token') ||
      searchParams.get('oauth_verifier') ||
      searchParams.get('session_state') ||
      // Check for NextAuth callback URL patterns
      window.location.pathname.includes('/api/auth/callback');

    // If we detect OAuth callback parameters and session needs refresh
    if (
      isCallback &&
      (status === 'loading' ||
        (status === 'unauthenticated' &&
          refreshAttempts.current < maxRefreshAttempts))
    ) {
      // Set a flag to prevent multiple refresh attempts
      hasProcessedCallback.current = true;
      refreshAttempts.current += 1;

      console.log(
        `🔄 OAuth callback detected (attempt ${refreshAttempts.current}/${maxRefreshAttempts}), refreshing session...`
      );

      // Force session refresh after a short delay to allow NextAuth to process
      const refreshTimer = setTimeout(async () => {
        try {
          const updatedSession = await update();

          // Wait a bit more and check if session was updated
          setTimeout(() => {
            // Re-check session status after update
            if (updatedSession?.user) {
              console.log('✅ Session refresh successful after OAuth callback');

              // Clear URL parameters after successful refresh
              if (typeof window !== 'undefined' && window.location.search) {
                const url = new URL(window.location.href);
                const cleanUrl = `${url.origin}${url.pathname}`;
                window.history.replaceState({}, '', cleanUrl);
              }

              // Reset counters for future use
              refreshAttempts.current = 0;
              hasProcessedCallback.current = false;
            } else if (refreshAttempts.current < maxRefreshAttempts) {
              // If still not authenticated, try again
              console.log(
                `⚠️ Session still not authenticated after refresh attempt ${refreshAttempts.current}, will retry...`
              );
              hasProcessedCallback.current = false; // Allow retry
            } else {
              console.warn(
                '❌ Failed to authenticate after maximum refresh attempts'
              );
            }
          }, 1000);
        } catch (error) {
          console.error(
            'Failed to refresh session after OAuth callback:',
            error
          );
          hasProcessedCallback.current = false; // Allow retry on error
        }
      }, 1500); // 1.5 second delay to allow NextAuth processing

      return () => clearTimeout(refreshTimer);
    }

    // Reset the flag when we have a successful session
    if (status === 'authenticated' && session?.user) {
      hasProcessedCallback.current = false;
      refreshAttempts.current = 0;
    }
  }, [searchParams, status, session, update, router]);

  // This component doesn't render anything
  return null;
}
