'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { useNavigationLoading } from './NavigationLoadingContext';

interface GlobalLoadingState {
  isLoading: boolean;
  activeRequests: Set<string>;
  loadingMessage: string | null;
}

interface GlobalLoadingContextType {
  isLoading: boolean;
  loadingMessage: string | null;
  startLoading: (requestId: string, message?: string) => void;
  stopLoading: (requestId: string) => void;
  clearAllLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(
  null
);

// Track original fetch for restoration
let originalFetch: typeof fetch;
let isInterceptorInstalled = false;

export function GlobalLoadingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [loadingState, setLoadingState] = useState<GlobalLoadingState>({
    isLoading: false,
    activeRequests: new Set(),
    loadingMessage: null
  });

  const { navigate } = useNavigationLoading();
  const loadingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Install fetch interceptor
  useEffect(() => {
    if (!isInterceptorInstalled && typeof window !== 'undefined') {
      isInterceptorInstalled = true;
      originalFetch = window.fetch;

      window.fetch = async (input: string | Request | URL, init?: any) => {
        const url = typeof input === 'string' ? input : input.toString();
        const method = init?.method || 'GET';
        const requestId = `${method}-${url}-${Date.now()}-${Math.random()}`;

        // Skip SSE requests, polling endpoints, and specific endpoints
        if (
          url.includes('/api/sse/') ||
          url.includes('/api/auth/session') ||
          url.includes('/_next/') ||
          url.includes('/api/version') ||
          url.includes('/api/link-preview') || // Skip link preview requests
          url.includes('/api/test/health') || // Skip health checks
          url.includes('/api/notifications/poll') || // Skip notification polling
          url.includes('buddha-api.com') // Skip Buddha API requests
        ) {
          return originalFetch(input, init);
        }

        // Debug: Log all intercepted requests
        // eslint-disable-next-line no-console
        // console.log('🌐 LOADING: Intercepted request:', {
        //   requestId,
        //   method,
        //   url
        // });

        const loadingMessage = getLoadingMessage(url, method);

        // Set loading timeout (2 seconds)
        const timeoutId = setTimeout(() => {
          setLoadingState((prev) => ({
            isLoading: true,
            activeRequests: new Set([...prev.activeRequests, requestId]),
            loadingMessage: loadingMessage || prev.loadingMessage
          }));
        }, 200);

        loadingTimeoutRef.current.set(requestId, timeoutId);

        try {
          const response = await originalFetch(input, init);

          // Debug: Log completed requests
          // eslint-disable-next-line no-console
          // console.log('✅ LOADING: Request completed:', {
          //   requestId,
          //   status: response.status
          // });

          // Handle rate limiting
          if (response.status === 429) {
            try {
              const rateLimitData = await response.clone().json();
              if (rateLimitData.retryAfter || rateLimitData.error) {
                sessionStorage.setItem(
                  'rate-limit-info',
                  JSON.stringify({
                    error: rateLimitData.error || 'Rate limit exceeded',
                    retryAfter: rateLimitData.retryAfter,
                    quotaType: rateLimitData.quotaType,
                    penaltyLevel: rateLimitData.penaltyLevel,
                    timestamp: Date.now()
                  })
                );
              }
            } catch (error) {
              // If we can't parse the response, still store basic rate limit info
              sessionStorage.setItem(
                'rate-limit-info',
                JSON.stringify({
                  error: 'Rate limit exceeded',
                  retryAfter: 60, // Default 1 minute
                  quotaType: 'unknown',
                  timestamp: Date.now()
                })
              );
            }
          }

          // Stop loading
          const timeoutId = loadingTimeoutRef.current.get(requestId);
          if (timeoutId) {
            clearTimeout(timeoutId);
            loadingTimeoutRef.current.delete(requestId);
          }

          setLoadingState((prev) => {
            const newRequests = new Set(prev.activeRequests);
            newRequests.delete(requestId);
            // eslint-disable-next-line no-console
            // console.log('🔄 LOADING: Updated loading state:', {
            //   activeRequests: Array.from(newRequests),
            //   isLoading: newRequests.size > 0
            // });
            return {
              isLoading: newRequests.size > 0,
              activeRequests: newRequests,
              loadingMessage: newRequests.size > 0 ? prev.loadingMessage : null
            };
          });

          return response;
        } catch (error) {
          // Debug: Log failed requests
          // eslint-disable-next-line no-console
          console.error('❌ LOADING: Request failed:', { requestId, error });

          // Stop loading on error
          const timeoutId = loadingTimeoutRef.current.get(requestId);
          if (timeoutId) {
            clearTimeout(timeoutId);
            loadingTimeoutRef.current.delete(requestId);
          }

          setLoadingState((prev) => {
            const newRequests = new Set(prev.activeRequests);
            newRequests.delete(requestId);
            return {
              isLoading: newRequests.size > 0,
              activeRequests: newRequests,
              loadingMessage: newRequests.size > 0 ? prev.loadingMessage : null
            };
          });

          throw error;
        }
      };
    }

    // Cleanup on unmount
    return () => {
      if (originalFetch && isInterceptorInstalled) {
        window.fetch = originalFetch;
        isInterceptorInstalled = false;
      }

      // Clear all timeouts
      loadingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      loadingTimeoutRef.current.clear();
    };
  }, []);

  const startLoading = useCallback((requestId: string, message?: string) => {
    setLoadingState((prev) => ({
      isLoading: true,
      activeRequests: new Set([...prev.activeRequests, requestId]),
      loadingMessage: message || prev.loadingMessage
    }));
  }, []);

  const stopLoading = useCallback((requestId: string) => {
    setLoadingState((prev) => {
      const newRequests = new Set(prev.activeRequests);
      newRequests.delete(requestId);
      return {
        isLoading: newRequests.size > 0,
        activeRequests: newRequests,
        loadingMessage: newRequests.size > 0 ? prev.loadingMessage : null
      };
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    // eslint-disable-next-line no-console
    // console.log('🧹 LOADING: Clearing all loading states');
    setLoadingState({
      isLoading: false,
      activeRequests: new Set(),
      loadingMessage: null
    });

    // Clear all timeouts
    loadingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    loadingTimeoutRef.current.clear();
  }, []);

  // Debug helper - expose to window in development
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined'
    ) {
      (window as any).debugLoading = {
        getActiveRequests: () => Array.from(loadingState.activeRequests),
        clearAllLoading,
        getLoadingState: () => loadingState
      };

      // Auto-clear stuck loading states after 30 seconds
      const autoClearTimer = setTimeout(() => {
        if (loadingState.activeRequests.size > 0) {
          // eslint-disable-next-line no-console
          console.warn(
            '🚨 Auto-clearing stuck loading states:',
            Array.from(loadingState.activeRequests)
          );
          clearAllLoading();
        }
      }, 30000);

      return () => clearTimeout(autoClearTimer);
    }
  }, [loadingState, clearAllLoading]);

  const value: GlobalLoadingContextType = {
    isLoading: loadingState.isLoading,
    loadingMessage: loadingState.loadingMessage,
    startLoading,
    stopLoading,
    clearAllLoading
  };

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error(
      'useGlobalLoading must be used within GlobalLoadingProvider'
    );
  }
  return context;
}

// Helper function to generate appropriate loading messages
function getLoadingMessage(url: string, method: string): string | null {
  if (url.includes('/api/admin/users/') && method === 'GET') {
    return 'Loading user details...';
  }

  if (
    url.includes('/api/admin/users/') &&
    (method === 'POST' || method === 'PATCH')
  ) {
    return 'Updating user...';
  }

  if (
    url.includes('/api/admin/users/') &&
    url.includes('/quotas') &&
    method === 'PATCH'
  ) {
    return 'Updating quota...';
  }

  if (
    url.includes('/api/admin/users/') &&
    url.includes('/quotas/reset') &&
    method === 'POST'
  ) {
    return 'Resetting quota usage...';
  }

  if (url.includes('/api/submissions') || url.includes('/api/posts')) {
    return 'Loading posts...';
  }

  if (url.includes('/api/emojis')) {
    return 'Loading emojis...';
  }

  if (url.includes('/api/upload')) {
    return 'Uploading file...';
  }

  if (url.includes('/api/admin/quotas/global') && method === 'POST') {
    return 'Creating global quota...';
  }

  if (url.includes('/api/admin/quotas/global') && method === 'PUT') {
    return 'Updating global quota...';
  }

  if (url.includes('/api/admin/quotas/global') && method === 'DELETE') {
    return 'Deleting global quota...';
  }

  if (url.includes('/api/admin')) {
    return 'Processing admin action...';
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return 'Saving changes...';
  }

  if (method === 'DELETE') {
    return 'Deleting...';
  }

  return 'Loading...';
}

// Export a hook for manual loading control
export function useManualLoading() {
  const { startLoading, stopLoading } = useGlobalLoading();

  return useCallback(
    async function <T>(
      asyncOperation: () => Promise<T>,
      message?: string
    ): Promise<T> {
      const requestId = `manual-${Date.now()}-${Math.random()}`;

      startLoading(requestId, message);

      try {
        const result = await asyncOperation();
        stopLoading(requestId);
        return result;
      } catch (error) {
        stopLoading(requestId);
        throw error;
      }
    },
    [startLoading, stopLoading]
  );
}
