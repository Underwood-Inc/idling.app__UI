'use client';

/* eslint-disable no-console */

import { sessionDataAtom } from '@lib/state/atoms';
import { useAtom } from 'jotai';
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
 * SessionRefreshHandler - Handles OAuth callback session refresh and session validation
 *
 * This component detects when a user returns from OAuth provider
 * and forces a session refresh to ensure the UI reflects the new
 * authentication state without requiring a hard refresh.
 *
 * Session validation is now handled via the session atom that gets updated
 * automatically from API wrapper responses instead of making separate API calls.
 */
export function SessionRefreshHandler() {
  const { data: session, status } = useSession();
  const [sessionData] = useAtom(sessionDataAtom);
  const lastValidationRef = useRef<number>(0);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const validationInterval = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    // Only check if enough time has passed
    if (now - lastValidationRef.current < validationInterval) return;

    let isValidating = false;

    const validateSession = async () => {
      if (isValidating) return;
      isValidating = true;

      try {
        // Check session data from atom (updated by API wrapper responses)
        if (sessionData) {
          const { timeoutInfo, isValid, lastUpdated } = sessionData;

          // Check if session data is recent (within last 5 minutes)
          const dataAge = now - new Date(lastUpdated).getTime();
          const maxDataAge = 5 * 60 * 1000; // 5 minutes

          if (dataAge < maxDataAge) {
            // Use fresh session data from atom
            if (!isValid || !timeoutInfo?.userValidated) {
              console.log(
                '🔒 Session data indicates invalid session, signing out...'
              );
              await signOut({
                redirect: true,
                callbackUrl: '/auth/signin?reason=session_invalid'
              });
              return;
            }

            // Check if user is timed out
            if (timeoutInfo?.is_timed_out) {
              console.log('🔒 User is timed out, signing out...');
              await signOut({
                redirect: true,
                callbackUrl: '/auth/signin?reason=user_timed_out'
              });
              return;
            }

            // Check if user is inactive
            if (timeoutInfo?.userInfo && !timeoutInfo.userInfo.is_active) {
              console.log('🔒 User account is inactive, signing out...');
              await signOut({
                redirect: true,
                callbackUrl: '/auth/signin?reason=user_inactive'
              });
              return;
            }

            lastValidationRef.current = now;
          }
          // If data is stale, validation will happen when next API call updates the atom
        }
        // If no session data in atom yet, validation will happen when next API call updates it
      } catch (error) {
        console.error('Session validation failed:', error);
        // On error, don't sign out automatically - could be temporary
      } finally {
        isValidating = false;
      }
    };

    // Initial validation check
    validateSession();

    // Set up interval for periodic checks
    const interval = setInterval(validateSession, validationInterval);

    return () => clearInterval(interval);
  }, [session, status, sessionData]);

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
