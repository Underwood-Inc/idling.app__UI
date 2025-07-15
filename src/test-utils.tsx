import { render, RenderOptions } from '@testing-library/react';
import React from 'react';
import { NavigationLoadingProvider } from './lib/context/NavigationLoadingContext';
import { OverlayProvider } from './lib/context/OverlayContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationLoadingProvider>
      <OverlayProvider>{children}</OverlayProvider>
    </NavigationLoadingProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
