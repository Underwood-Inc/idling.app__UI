'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react';

interface NavigationState {
  isNavigating: boolean;
  targetPath: string | null;
  isPending: boolean;
}

interface NavigationLoadingContextType {
  navigate: (path: string, options?: { scroll?: boolean }) => void;
  isNavigating: boolean;
  targetPath: string | null;
  isPending: boolean;
}

const NavigationLoadingContext =
  createContext<NavigationLoadingContextType | null>(null);

export function NavigationLoadingProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    targetPath: null,
    isPending: false
  });

  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const previousPathnameRef = useRef(pathname);

  // Enhanced navigation function with instant feedback
  const navigate = useCallback(
    (path: string, options?: { scroll?: boolean }) => {
      // Don't navigate if already on the target path
      if (pathname === path) {
        return;
      }

      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      // Immediate UI feedback
      setNavigationState({
        isNavigating: true,
        targetPath: path,
        isPending: true
      });

      // Use transition for smooth navigation
      startTransition(() => {
        router.push(path, { scroll: options?.scroll ?? true });
      });

      // Fallback timeout to clear loading state if navigation doesn't complete
      navigationTimeoutRef.current = setTimeout(() => {
        setNavigationState({
          isNavigating: false,
          targetPath: null,
          isPending: false
        });
      }, 5000); // 5 second timeout
    },
    [router, pathname]
  );

  // Reset navigation state when route changes
  useEffect(() => {
    // Check if pathname actually changed
    if (pathname !== previousPathnameRef.current) {
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      // Reset navigation state
      setNavigationState({
        isNavigating: false,
        targetPath: null,
        isPending: false
      });

      // Update previous pathname
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Also reset when transition completes without route change
  useEffect(() => {
    if (!isPending && navigationState.isPending) {
      // Small delay to allow for route change detection
      const timeout = setTimeout(() => {
        setNavigationState((prev) => ({
          ...prev,
          isPending: false,
          isNavigating: false
        }));
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [isPending, navigationState.isPending]);

  // Additional effect to prevent false positives from React transitions
  useEffect(() => {
    // If isPending becomes true but we haven't called navigate, reset it
    if (isPending && !navigationState.isNavigating) {
      const timeout = setTimeout(() => {
        // Double-check that this isn't a legitimate navigation
        if (isPending && !navigationState.isNavigating) {
          // This is likely a false positive from React transitions
          // Just let it timeout naturally
        }
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [isPending, navigationState.isNavigating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    navigate,
    isNavigating: navigationState.isNavigating,
    targetPath: navigationState.targetPath,
    isPending
  };

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error(
      'useNavigationLoading must be used within NavigationLoadingProvider'
    );
  }
  return context;
}
