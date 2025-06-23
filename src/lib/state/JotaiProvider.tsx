'use client';
import { Provider, useSetAtom } from 'jotai';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect } from 'react';
import { CONTEXT_IDS } from '../context-ids';
import { NAV_PATHS } from '../routes';
import { initializePaginationFromUrl, paginationStateAtom } from './atoms';

/**
 * Internal component to initialize pagination state from URL
 * This runs on the client side and initializes atoms based on URL parameters
 */
function PaginationInitializer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setPaginationState = useSetAtom(paginationStateAtom);

  useEffect(() => {
    // Determine context ID based on pathname (same logic as PageContainer)
    let contextId = CONTEXT_IDS.DEFAULT.toString();

    if (pathname === NAV_PATHS.POSTS) {
      contextId = CONTEXT_IDS.POSTS.toString();
    } else if (pathname === NAV_PATHS.MY_POSTS) {
      contextId = CONTEXT_IDS.MY_POSTS.toString();
    }

    // Initialize pagination state from URL parameters
    const urlSearchParams = new URLSearchParams(searchParams.toString());
    const initialState = initializePaginationFromUrl(
      contextId,
      urlSearchParams
    );

    // Set the initial state
    setPaginationState((prevState) => ({
      ...prevState,
      ...initialState
    }));
  }, [pathname, searchParams.toString(), setPaginationState]);

  return null;
}

/**
 * Jotai Provider that replaces all Context providers
 * Maintains server/client boundaries and initializes state properly
 */
export function JotaiProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <Suspense fallback={null}>
        <PaginationInitializer />
      </Suspense>
      {children}
    </Provider>
  );
}

/**
 * Wrapper component for easy migration
 * Ensures proper provider wrapping
 */
export function withJotaiProvider<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <JotaiProvider>
        <Component {...props} />
      </JotaiProvider>
    );
  };
}
