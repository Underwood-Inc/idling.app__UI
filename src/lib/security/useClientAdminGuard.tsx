'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

/**
 * CLIENT-SIDE ADMIN SECURITY GUARD
 * 
 * This hook MUST be used in every admin client component to ensure
 * real-time permission validation and prevent cached access.
 * 
 * Features:
 * - Real-time session validation
 * - Live permission checking via API
 * - Automatic redirects for unauthorized users
 * - Cache-busting on every check
 * - Protection against permission escalation
 */

interface AdminGuardState {
  isLoading: boolean;
  isAuthorized: boolean;
  error: string | null;
}

interface AdminPermissionCheck {
  authenticated: boolean;
  hasAdminAccess: boolean;
  userId: string | null;
  roles: string[];
  permissions: string[];
}

export function useClientAdminGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [guardState, setGuardState] = useState<AdminGuardState>({
    isLoading: true,
    isAuthorized: false,
    error: null
  });

  // Real-time permission validation
  const validateAdminAccess = async (): Promise<void> => {
    try {
      setGuardState(prev => ({ ...prev, isLoading: true, error: null }));

      // Step 1: Check session exists
      if (status === 'loading') {
        return; // Wait for session to load
      }

      if (status === 'unauthenticated' || !session?.user?.id) {
        setGuardState({
          isLoading: false,
          isAuthorized: false,
          error: 'Not authenticated'
        });
        router.replace('/api/auth/signin');
        return;
      }

      // Step 2: Validate admin permissions via API (cache-busted)
      const timestamp = Date.now();
      const response = await fetch(`/api/test/admin-check?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Permission check failed: ${response.status}`);
      }

      const adminCheck: AdminPermissionCheck = await response.json();

      // Step 3: Validate response
      if (!adminCheck.authenticated || !adminCheck.hasAdminAccess) {
        setGuardState({
          isLoading: false,
          isAuthorized: false,
          error: 'Admin access denied'
        });
        
        // Clear any cached admin data
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          localStorage.removeItem('admin-cache');
        }
        
        router.replace('/');
        return;
      }

      // Step 4: All checks passed
      setGuardState({
        isLoading: false,
        isAuthorized: true,
        error: null
      });

    } catch (error) {
      console.error('❌ CLIENT ADMIN GUARD: Permission validation failed:', error);
      setGuardState({
        isLoading: false,
        isAuthorized: false,
        error: error instanceof Error ? error.message : 'Permission check failed'
      });
      
      // Clear caches and redirect on error
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('admin-cache');
      }
      router.replace('/');
    }
  };

  // Initial validation and session change monitoring
  useEffect(() => {
    validateAdminAccess();
  }, [session, status]);

  // Periodic re-validation every 30 seconds
  useEffect(() => {
    if (!guardState.isAuthorized) return;

    const interval = setInterval(() => {
      validateAdminAccess();
    }, 30000); // Re-check every 30 seconds

    return () => clearInterval(interval);
  }, [guardState.isAuthorized]);

  // Clear everything on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('admin-cache');
      }
    };
  }, []);

  return {
    isLoading: guardState.isLoading,
    isAuthorized: guardState.isAuthorized,
    error: guardState.error,
    revalidate: validateAdminAccess
  };
}

/**
 * HOC Component for wrapping admin components with security
 */
export function withClientAdminGuard<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AdminGuardedComponent(props: P) {
    const { isLoading, isAuthorized, error } = useClientAdminGuard();

    if (isLoading) {
      return (
        <div className="admin-security-loading">
          <div className="security-spinner"></div>
          <p>🔐 Validating admin permissions...</p>
        </div>
      );
    }

    if (!isAuthorized || error) {
      return (
        <div className="admin-security-error">
          <h3>🚫 Access Denied</h3>
          <p>{error || 'You do not have admin permissions'}</p>
          <button onClick={() => (window.location.href = '/')}>
            Return Home
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };
} 