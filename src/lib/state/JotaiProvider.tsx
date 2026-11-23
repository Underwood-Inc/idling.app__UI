'use client';
import { Provider } from 'jotai';
import React from 'react';
import { useSessionDataSync } from '../hooks/useApiWrapperData';

function SessionDataSyncProvider() {
  useSessionDataSync();
  return null;
}

export function JotaiProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <SessionDataSyncProvider />
      {children}
    </Provider>
  );
}

export function withJotaiProvider<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function WrappedComponent(props: P) {
    return (
      <JotaiProvider>
        <Component {...props} />
      </JotaiProvider>
    );
  };
}