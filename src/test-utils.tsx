import { render, RenderOptions } from '@testing-library/react';
import React from 'react';
import { NavigationLoadingProvider } from './lib/context/NavigationLoadingContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <NavigationLoadingProvider>{children}</NavigationLoadingProvider>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
