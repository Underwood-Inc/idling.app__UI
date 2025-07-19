'use client';

/**
 * Client-Side Security Guard Hook
 * 
 * SECURITY CRITICAL: This hook provides automatic client-side security validation
 * that runs on every component mount and performs regular security checks.
 * 
 * Features:
 * - Automatic security validation on component mount
 * - Periodic security state validation
 * - Real-time session monitoring
 * - Automatic logout on security failures
 * - Permission checking for client components
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { performSecureLogout } from './secure-logout';

export interface ClientSecurityOptions {
  requireAuth?: boolean;
  requireActiveAccount?: boolean;
  requiredPermissions?: string[];
  allowGuestAccess?: boolean;
  securityLevel?: 'basic' | 'standard' | 'high' | 'maximum';
  checkInterval?: number; // milliseconds
  enablePeriodicChecks?: boolean;
}

export interface ClientSecurityState {
  isSecure: boolean;
  isValidating: boolean;
  lastCheck: Date | null;
  failureReason?: string;
  securityContext?: any;
}

/**
 * SECURITY CRITICAL: Client-side security guard hook
 * Use this hook in components that require security validation
 */
export function useClientSecurityGuard(options: ClientSecurityOptions = {}) {
  const {
    requireAuth = true,
    requireActiveAccount = true,
    requiredPermissions = [],
    allowGuestAccess = false,
    securityLevel = 'standard',
    checkInterval = 5 * 60 * 1000, // 5 minutes default
    enablePeriodicChecks = true
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [securityState, setSecurityState] = useState<ClientSecurityState>({
    isSecure: false,
    isValidating: true,
    lastCheck: null
  });

  const lastValidationRef = useRef<number>(0);
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const isValidatingRef = useRef(false);

  /**
   * Perform client-side security validation
   */
  const performSecurityCheck = async (): Promise<boolean> => {
    if (isValidatingRef.current) return securityState.isSecure;
    
    isValidatingRef.current = true;
    setSecurityState(prev => ({ ...prev, isValidating: true }));

    try {
      // Basic authentication check
      const isAuthenticated = !!session?.user?.id;
      
      if (requireAuth && !isAuthenticated && !allowGuestAccess) {
        console.log('🔒 CLIENT SECURITY: Authentication required, redirecting...');
        setSecurityState({
          isSecure: false,
          isValidating: false,
          lastCheck: new Date(),
          failureReason: 'Authentication required'
        });
        
        router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}&reason=client_auth_required`);
        return false;
      }

      if (isAuthenticated) {
        // Validate session is still valid by making a test API call
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });

          if (!response.ok) {
            console.log('🔒 CLIENT SECURITY: Session validation failed, performing secure logout...');
            
            setSecurityState({
              isSecure: false,
              isValidating: false,
              lastCheck: new Date(),
              failureReason: 'Session validation failed'
            });

            // Perform secure logout
            await performSecureLogout({ level: 'comprehensive' });
            router.push('/auth/signin?reason=session_invalid');
            return false;
          }

          const sessionData = await response.json();
          
          // Check if the session data indicates we need to logout
          if (!sessionData || !sessionData.user) {
            console.log('🔒 CLIENT SECURITY: No valid session data, performing secure logout...');
            
            setSecurityState({
              isSecure: false,
              isValidating: false,
              lastCheck: new Date(),
              failureReason: 'Invalid session data'
            });

            await performSecureLogout({ level: 'comprehensive' });
            router.push('/auth/signin?reason=invalid_session_data');
            return false;
          }

          // Check for required permissions (simplified client-side check)
          if (requiredPermissions.length > 0) {
            try {
              const permissionResponse = await fetch('/api/auth/permissions', {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache'
                }
              });

              if (!permissionResponse.ok) {
                console.log('🔒 CLIENT SECURITY: Permission check failed, redirecting...');
                
                setSecurityState({
                  isSecure: false,
                  isValidating: false,
                  lastCheck: new Date(),
                  failureReason: 'Permission check failed'
                });

                router.push('/auth/signin?reason=permission_check_failed');
                return false;
              }

              const permissionData = await permissionResponse.json();
              
              // Basic permission checking (server-side will do the real validation)
              for (const permission of requiredPermissions) {
                if (!permissionData.permissions?.includes(permission)) {
                  console.log(`🔒 CLIENT SECURITY: Missing required permission: ${permission}`);
                  
                  setSecurityState({
                    isSecure: false,
                    isValidating: false,
                    lastCheck: new Date(),
                    failureReason: `Missing permission: ${permission}`
                  });

                  router.push('/auth/signin?reason=insufficient_permissions');
                  return false;
                }
              }

            } catch (permissionError) {
              console.error('🔒 CLIENT SECURITY: Permission validation error:', permissionError);
              
              setSecurityState({
                isSecure: false,
                isValidating: false,
                lastCheck: new Date(),
                failureReason: 'Permission validation error'
              });

              router.push('/auth/signin?reason=permission_error');
              return false;
            }
          }

          // High security checks
          if (securityLevel === 'high' || securityLevel === 'maximum') {
            const sessionAge = Date.now() - new Date(sessionData.expires || 0).getTime();
            const maxAge = securityLevel === 'maximum' ? 30 * 60 * 1000 : 60 * 60 * 1000; // 30min/1hr

            if (sessionAge > maxAge) {
              console.log('🔒 CLIENT SECURITY: Session too old for security level, refreshing...');
              
              setSecurityState({
                isSecure: false,
                isValidating: false,
                lastCheck: new Date(),
                failureReason: 'Session expired for security level'
              });

              await performSecureLogout({ level: 'comprehensive' });
              router.push('/auth/signin?reason=session_expired_security');
              return false;
            }
          }

        } catch (error) {
          console.error('🔒 CLIENT SECURITY: Security check failed:', error);
          
          setSecurityState({
            isSecure: false,
            isValidating: false,
            lastCheck: new Date(),
            failureReason: 'Security check error'
          });

          // On error, perform secure logout and redirect
          await performSecureLogout({ level: 'comprehensive' });
          router.push('/auth/signin?reason=security_error');
          return false;
        }
      }

      // Security check passed
      setSecurityState({
        isSecure: true,
        isValidating: false,
        lastCheck: new Date(),
        securityContext: session
      });

      lastValidationRef.current = Date.now();
      return true;

    } catch (error) {
      console.error('🔒 CLIENT SECURITY: Unexpected security check error:', error);
      
      setSecurityState({
        isSecure: false,
        isValidating: false,
        lastCheck: new Date(),
        failureReason: 'Unexpected error'
      });

      return false;
    } finally {
      isValidatingRef.current = false;
    }
  };

  // Initial security check on mount
  useEffect(() => {
    if (status === 'loading') return;
    
    performSecurityCheck();
  }, [session, status, router]);

  // Periodic security checks
  useEffect(() => {
    if (!enablePeriodicChecks || status === 'loading') return;

    const interval = setInterval(() => {
      const timeSinceLastCheck = Date.now() - lastValidationRef.current;
      
      if (timeSinceLastCheck >= checkInterval) {
        console.log('🔒 CLIENT SECURITY: Performing periodic security check...');
        performSecurityCheck();
      }
    }, Math.min(checkInterval, 60000)); // Check at least every minute

    return () => clearInterval(interval);
  }, [checkInterval, enablePeriodicChecks, status]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Manual security check function
  const recheckSecurity = async () => {
    return await performSecurityCheck();
  };

  // Force logout function
  const forceLogout = async (reason = 'manual_logout') => {
    console.log('🔒 CLIENT SECURITY: Force logout triggered:', reason);
    
    setSecurityState({
      isSecure: false,
      isValidating: false,
      lastCheck: new Date(),
      failureReason: reason
    });

    await performSecureLogout({ level: 'comprehensive' });
    router.push(`/auth/signin?reason=${reason}`);
  };

  return {
    ...securityState,
    recheckSecurity,
    forceLogout,
    securityLevel,
    options
  };
}

/**
 * SECURITY CRITICAL: Higher-order component for automatic security
 * Wraps components to automatically enforce security requirements
 */
export function withClientSecurity<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  securityOptions: ClientSecurityOptions = {}
) {
  return function SecurityWrappedComponent(props: T) {
    const { isSecure, isValidating, failureReason } = useClientSecurityGuard(securityOptions);

    // Show loading state while validating
    if (isValidating) {
      return (
        <div className="security-validating">
          <div>🔒 Validating security...</div>
        </div>
      );
    }

    // Show error state if security check failed
    if (!isSecure) {
      return (
        <div className="security-failed">
          <div>🚫 Security validation failed</div>
          {failureReason && <div>Reason: {failureReason}</div>}
          <div>Redirecting to login...</div>
        </div>
      );
    }

    // Render the component if security is valid
    return <Component {...props} />;
  };
} 