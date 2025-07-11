/**
 * Jest Mocks Index - Essential Mocks Only
 * 
 * Central export point for only the essential mocks that were working before.
 * This file provides a clean interface for importing minimal mock functions.
 */

// Import only essential mock categories
import { mockWindowAPIs } from './browser/window';
import { mockDOMAPIs } from './dom/elements';

// Export individual essential mock categories
export {
    mockDOMAPIs, mockWindowAPIs
};

/**
 * Apply only essential browser environment mocks
 * 
 * This function applies only the minimal mocks that were working before:
 * - window.matchMedia
 * - IntersectionObserver
 * - ResizeObserver
 */
export const mockEssentialBrowserAPIs = (): void => {
  mockWindowAPIs();
  mockDOMAPIs();
};

/**
 * Default export for convenience
 */
export default mockEssentialBrowserAPIs; 