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
    if (typeof window === 'undefined' || isInterceptorInstalled) return;

    originalFetch = window.fetch;
    isInterceptorInstalled = true;

    window.fetch = async (
      input: string | Request | URL,
      init?: any
    ): Promise<Response> => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const method = init?.method || 'GET';

      // Skip certain requests from global loading
      const shouldSkip =
        url.includes('/api/auth/') ||
        url.includes('_next/') ||
        url.includes('/favicon') ||
        url.includes('/manifest') ||
        url.includes('/sw.js') ||
        method === 'HEAD' ||
        (init?.headers as any)?.['x-skip-global-loading'];

      if (shouldSkip) {
        return originalFetch(input, init);
      }

      const requestId = `${method}-${url}-${Date.now()}`;
      const loadingMessage = getLoadingMessage(url, method);

      // Start loading
      setLoadingState((prev) => ({
        isLoading: true,
        activeRequests: new Set([...prev.activeRequests, requestId]),
        loadingMessage: loadingMessage || prev.loadingMessage
      }));

      // Set a timeout to prevent stuck loading states
      const timeout = setTimeout(() => {
        setLoadingState((prev) => {
          const newRequests = new Set(prev.activeRequests);
          newRequests.delete(requestId);
          return {
            isLoading: newRequests.size > 0,
            activeRequests: newRequests,
            loadingMessage: newRequests.size > 0 ? prev.loadingMessage : null
          };
        });
      }, 30000); // 30 second timeout

      loadingTimeoutRef.current.set(requestId, timeout);

      try {
        const response = await originalFetch(input, init);

        // Stop loading
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

        return response;
      } catch (error) {
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
    setLoadingState({
      isLoading: false,
      activeRequests: new Set(),
      loadingMessage: null
    });

    // Clear all timeouts
    loadingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    loadingTimeoutRef.current.clear();
  }, []);

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

  if (url.includes('/api/admin/users/') && method === 'POST') {
    return 'Updating user...';
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
