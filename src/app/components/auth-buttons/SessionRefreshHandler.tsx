'use client';

/* eslint-disable no-console */

import { signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

/**
 * Internal SessionRefreshHandler that uses useSearchParams
 */
function SessionRefreshHandlerInternal() {
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

      // console.log(
      //   `🔄 OAuth callback detected (attempt ${refreshAttempts.current}/${maxRefreshAttempts}), refreshing session...`
      // );

      // Force session refresh after a short delay to allow NextAuth to process
      const refreshTimer = setTimeout(async () => {
        try {
          const updatedSession = await update();

          // Wait a bit more and check if session was updated
          setTimeout(() => {
            // Re-check session status after update
            if (updatedSession?.user) {
              // console.log('✅ Session refresh successful after OAuth callback');

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
              // console.log(
              //   `⚠️ Session still not authenticated after refresh attempt ${refreshAttempts.current}, will retry...`
              // );
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

/**
 * SessionRefreshHandler - Handles OAuth callback session refresh
 *
 * This component detects when a user returns from OAuth provider
 * and forces a session refresh to ensure the UI reflects the new
 * authentication state without requiring a hard refresh.
 */
export function SessionRefreshHandler() {
  const { data: session, status } = useSession();
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

    const refreshInterval = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    // Only refresh if enough time has passed
    if (now - lastRefreshRef.current < refreshInterval) return;

    let isRefreshing = false;

    const refreshSession = async () => {
      if (isRefreshing) return;
      isRefreshing = true;

      try {
        // Test if the session is still valid by making a lightweight API call
        const response = await fetch('/api/user/timeout?type=post_creation', {
          method: 'GET',
          credentials: 'include'
        });

        // Check if server indicates session should be cleared
        const clearSession = response.headers.get('X-Clear-Session') === 'true';

        if (
          clearSession ||
          response.status === 404 ||
          response.status === 401
        ) {
          console.log('🔒 Session invalidated by server, signing out...');
          await signOut({
            redirect: true,
            callbackUrl: '/auth/signin?reason=session_invalid'
          });
          return;
        }

        // If response indicates user validation failure, check the response body
        if (!response.ok) {
          try {
            const errorData = await response.json();
            if (errorData.clearSession || errorData.requiresReauth) {
              console.log(
                '🔒 Server requested session clearing, signing out...'
              );
              await signOut({
                redirect: true,
                callbackUrl: '/auth/signin?reason=user_not_found'
              });
              return;
            }
          } catch (e) {
            // If we can't parse the response, but it's not ok, sign out anyway
            console.log('🔒 Invalid session response, signing out...');
            await signOut({
              redirect: true,
              callbackUrl: '/auth/signin?reason=invalid_response'
            });
            return;
          }
        }

        lastRefreshRef.current = now;
      } catch (error) {
        console.error('Session refresh failed:', error);
        // On network error, don't sign out automatically - could be temporary
      } finally {
        isRefreshing = false;
      }
    };

    // Initial refresh check
    refreshSession();

    // Set up interval for periodic checks
    const interval = setInterval(refreshSession, refreshInterval);

    return () => clearInterval(interval);
  }, [session, status]);

  // Also set up a global fetch interceptor to catch session invalidation responses
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);

      // Check for session invalidation headers
      if (response.headers.get('X-Clear-Session') === 'true') {
        console.log('🔒 Global session invalidation detected, signing out...');
        await signOut({
          redirect: true,
          callbackUrl: '/auth/signin?reason=global_invalidation'
        });
        return response;
      }

      // Check for specific error responses that indicate session issues
      if (
        (response.status === 404 || response.status === 401) &&
        response.url.includes('/api/')
      ) {
        try {
          const clonedResponse = response.clone();
          const errorData = await clonedResponse.json();

          if (errorData.clearSession || errorData.requiresReauth) {
            console.log(
              '🔒 API response requested session clearing, signing out...'
            );
            await signOut({
              redirect: true,
              callbackUrl: '/auth/signin?reason=api_invalidation'
            });
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <SessionRefreshHandlerInternal />
    </Suspense>
  );
}
